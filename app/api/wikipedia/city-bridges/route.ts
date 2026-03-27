import { NextRequest, NextResponse } from "next/server";

interface BridgeResult {
  name: string;
  yearBuilt: number | null;
  distance: string | null;
  funFacts: string[];
  wikipediaUrl: string;
}

function parseYearBuilt(text: string): number | null {
  // Try specific patterns first: "opened in 1937", "built in 1901", "completed on January 12, 1937"
  const patterns = [
    /(?:opened|built|completed|constructed|inaugurated|opened to traffic)\s+(?:in\s+)?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+)?(\d{4})/i,
    /(?:opened|built|completed|constructed|inaugurated|opened to traffic)\s+(?:on\s+)?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+)?(\d{4})/i,
    /(?:since|from)\s+(\d{4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  // Fallback: find first 4-digit year between 1500-2030 in the first 2 sentences
  const firstSentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const yearMatch = firstSentences.match(/\b(1[5-9]\d{2}|20[0-3]\d)\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

function parseDistance(text: string): string | null {
  const milesMatch = text.match(/(\d+[,.]?\d*)\s*(?:miles?|mi)\b/i);
  if (milesMatch) return `${milesMatch[1]} mi`;

  const feetMatch = text.match(/([\d,]+)\s*(?:feet|ft|foot)\b/i);
  if (feetMatch) {
    const feet = parseFloat(feetMatch[1].replace(/,/g, ""));
    return `${(feet / 5280).toFixed(1)} mi`;
  }

  const metersMatch = text.match(/([\d,]+)\s*(?:metres?|meters?|m)\b/i);
  if (metersMatch) {
    const meters = parseFloat(metersMatch[1].replace(/,/g, ""));
    return `${(meters / 1609.34).toFixed(1)} mi`;
  }

  return null;
}

function extractFunFacts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && !s.startsWith("For ") && !s.startsWith("See "))
    .slice(0, 3);
}

async function fetchSummary(title: string): Promise<BridgeResult | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BridgeWalks/1.0" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const extract = data.extract || "";
    const desc = (data.description || "").toLowerCase();

    // Filter out non-bridge articles (TV shows, lists, transportation overviews, etc.)
    if (
      desc.includes("list of") ||
      desc.includes("transportation") ||
      desc.includes("disambigu") ||
      desc.includes("television") ||
      desc.includes("tv series") ||
      desc.includes("film") ||
      desc.includes("novel") ||
      desc.includes("song") ||
      desc.includes("album")
    ) {
      return null;
    }

    return {
      name: data.title || title,
      yearBuilt: parseYearBuilt(extract),
      distance: parseDistance(extract),
      funFacts: extractFunFacts(extract),
      wikipediaUrl: data.content_urls?.desktop?.page || "",
    };
  } catch {
    return null;
  }
}

async function searchWikipedia(query: string): Promise<string[]> {
  try {
    // Use MediaWiki search API (srsearch) for better full-text results
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BridgeWalks/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.query?.search || []).map(
      (r: { title: string }) => r.title
    );
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  if (!city) {
    return NextResponse.json({ bridges: [] });
  }

  try {
    // Run multiple search queries in parallel for better coverage
    const queries = [
      `${city} bridge`,
      `bridges in ${city}`,
      `${city} pedestrian bridge`,
    ];

    const allResults = await Promise.all(queries.map(searchWikipedia));
    const allTitles = allResults.flat();

    // Dedupe and filter to likely bridge articles
    const seen = new Set<string>();
    const bridgeTitles: string[] = [];
    for (const title of allTitles) {
      const lower = title.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      // Title must contain bridge/viaduct/crossing keywords
      if (/bridge|viaduct|overpass|crossing/i.test(title)) {
        // Exclude "list of" and "bridges in" aggregate articles
        if (!/^list of|^bridges in|^bridges of/i.test(title)) {
          bridgeTitles.push(title);
        }
      }
    }

    // Fetch summaries in parallel (cap at 12 to avoid overloading)
    const summaries = await Promise.all(
      bridgeTitles.slice(0, 12).map(fetchSummary)
    );
    const bridges = summaries.filter(
      (b): b is BridgeResult => b !== null
    );

    return NextResponse.json({ bridges });
  } catch {
    return NextResponse.json({ bridges: [] });
  }
}
