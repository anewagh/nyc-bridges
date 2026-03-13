import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getWalkBySlug, getWalkDataFromBlob, saveWalkToBlob, findBlobUrl } from "@/lib/walks";
import type { WalkData } from "@/lib/walks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Try blob first
  const blobData = await getWalkDataFromBlob(slug);
  if (blobData) {
    return NextResponse.json(blobData);
  }

  // Fall back to markdown
  const walk = await getWalkBySlug(slug);
  if (!walk) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json({
    date: walk.date,
    rating: walk.rating,
    weather: walk.weather,
    description: "",
    photos: walk.photos,
  } satisfies WalkData);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const existing = await getWalkDataFromBlob(slug);
    const rawPhotos: string[] = body.photos ?? existing?.photos ?? [];

    // Normalize photos: strip proxy prefix so only raw blob URLs are stored
    const cleanPhotos = rawPhotos.map((p: string) => {
      if (p.startsWith("/api/blob-image?url=")) {
        const encoded = p.replace("/api/blob-image?url=", "");
        const decoded = decodeURIComponent(encoded);
        // Strip ?download=1 suffix if present
        return decoded.replace(/\?download=1$/, "");
      }
      return p;
    });

    const data: WalkData = {
      date: body.date || "",
      rating: Number(body.rating) || 0,
      weather: body.weather || "",
      description: body.description || "",
      photos: cleanPhotos,
    };

    const saved = await saveWalkToBlob(slug, data);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = await findBlobUrl(`walks/${slug}.json`);
    if (url) {
      await del(url);
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
