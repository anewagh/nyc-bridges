import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search for cities/places - don't append "bridge"
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&format=json`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BridgeWalks/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const titles: string[] = data[1] || [];
    const descriptions: string[] = data[2] || [];

    const results = titles.map((title, i) => ({
      title,
      description: descriptions[i] || "",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
