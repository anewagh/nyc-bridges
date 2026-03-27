import { NextRequest, NextResponse } from "next/server";

function parseYearBuilt(text: string): number | null {
  const patterns = [
    /(?:opened|built|completed|constructed|inaugurated|opened to traffic)\s+(?:in\s+)?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+)?(\d{4})/i,
    /(?:opened|built|completed|constructed|inaugurated|opened to traffic)\s+(?:on\s+)?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+)?(\d{4})/i,
    /(?:since|from)\s+(\d{4})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1]);
  }
  const firstSentences = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const yearMatch = firstSentences.match(/\b(1[5-9]\d{2}|20[0-3]\d)\b/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

function parseDistance(text: string): string | null {
  // Try "X km (Y mi)" pattern first (common in non-US Wikipedia articles)
  const kmMiMatch = text.match(/([\d,.]+)\s*km\s*\(([\d,.]+)\s*mi\)/i);
  if (kmMiMatch) return `${kmMiMatch[2]} mi`;

  // Try miles in length context
  const milesInLengthMatch = text.match(/([\d,.]+)\s*(?:miles?|mi)\s*(?:in length|long|total)/i);
  if (milesInLengthMatch) return `${milesInLengthMatch[1].replace(/,/g, "")} mi`;

  // Try general miles
  const milesMatch = text.match(/([\d,.]+)\s*(?:miles?|mi)\b/i);
  if (milesMatch) return `${milesMatch[1].replace(/,/g, "")} mi`;

  // Try km and convert
  const kmMatch = text.match(/([\d,.]+)\s*(?:kilometres?|kilometers?|km)\b/i);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1].replace(/,/g, ""));
    return `${(km * 0.621371).toFixed(1)} mi`;
  }

  // Try feet and convert
  const feetMatch = text.match(/([\d,]+)\s*(?:feet|ft|foot)\s*(?:in length|long|total)/i);
  if (feetMatch) {
    const feet = parseFloat(feetMatch[1].replace(/,/g, ""));
    return `${(feet / 5280).toFixed(1)} mi`;
  }

  // Try meters and convert
  const metersMatch = text.match(/([\d,]+)\s*(?:metres?|meters?)\s*(?:in length|long|total)/i);
  if (metersMatch) {
    const meters = parseFloat(metersMatch[1].replace(/,/g, ""));
    return `${(meters / 1609.34).toFixed(1)} mi`;
  }

  return null;
}

function extractFunFacts(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && !s.startsWith("For ") && !s.startsWith("See "));

  return sentences.slice(0, 3);
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title");
  if (!title) {
    return NextResponse.json({ error: "Title param required" }, { status: 400 });
  }

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BridgeWalks/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Wikipedia fetch failed" }, { status: 502 });
    }

    const data = await res.json();
    const extract = data.extract || "";

    return NextResponse.json({
      name: data.title || title,
      description: data.description || "",
      extract,
      yearBuilt: parseYearBuilt(extract),
      distance: parseDistance(extract),
      funFacts: extractFunFacts(extract),
      thumbnail: data.thumbnail?.source || null,
      coordinates: data.coordinates || null,
      wikipediaUrl: data.content_urls?.desktop?.page || "",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from Wikipedia" }, { status: 502 });
  }
}
