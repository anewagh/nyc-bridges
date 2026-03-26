import { NextRequest, NextResponse } from "next/server";

function parseYearBuilt(text: string): number | null {
  const match = text.match(
    /(?:opened|built|completed|constructed|inaugurated|opened to traffic)\s+(?:in\s+)?(\d{4})/i
  );
  return match ? parseInt(match[1]) : null;
}

function parseDistance(text: string): string | null {
  // Try miles first
  const milesMatch = text.match(/(\d+[,.]?\d*)\s*(?:miles?|mi)\b/i);
  if (milesMatch) return `${milesMatch[1]} mi`;

  // Try feet and convert
  const feetMatch = text.match(/([\d,]+)\s*(?:feet|ft|foot)\b/i);
  if (feetMatch) {
    const feet = parseFloat(feetMatch[1].replace(/,/g, ""));
    const miles = (feet / 5280).toFixed(1);
    return `${miles} mi`;
  }

  // Try meters and convert
  const metersMatch = text.match(/([\d,]+)\s*(?:metres?|meters?|m)\b/i);
  if (metersMatch) {
    const meters = parseFloat(metersMatch[1].replace(/,/g, ""));
    const miles = (meters / 1609.34).toFixed(1);
    return `${miles} mi`;
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
