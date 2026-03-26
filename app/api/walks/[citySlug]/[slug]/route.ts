import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getWalkBySlug, getWalkDataFromBlob, saveWalkToBlob, findBlobUrl, walkBlobPath } from "@/lib/walks";
import type { WalkData } from "@/lib/walks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ citySlug: string; slug: string }> }
) {
  const { citySlug, slug } = await params;

  const blobData = await getWalkDataFromBlob(slug, citySlug);
  if (blobData) {
    return NextResponse.json(blobData);
  }

  // Markdown fallback only for NYC
  if (citySlug === "nyc") {
    const walk = await getWalkBySlug(slug, citySlug);
    if (walk) {
      return NextResponse.json({
        date: walk.date,
        rating: walk.rating,
        weather: walk.weather,
        description: "",
        photos: walk.photos,
      } satisfies WalkData);
    }
  }

  return NextResponse.json(null, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ citySlug: string; slug: string }> }
) {
  try {
    const { citySlug, slug } = await params;
    const body = await request.json();

    const existing = await getWalkDataFromBlob(slug, citySlug);
    const rawPhotos: string[] = body.photos ?? existing?.photos ?? [];

    const cleanPhotos = rawPhotos.map((p: string) => {
      if (p.startsWith("/api/blob-image?url=")) {
        const encoded = p.replace("/api/blob-image?url=", "");
        const decoded = decodeURIComponent(encoded);
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

    const saved = await saveWalkToBlob(slug, data, citySlug);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ citySlug: string; slug: string }> }
) {
  try {
    const { citySlug, slug } = await params;
    const url = await findBlobUrl(walkBlobPath(slug, citySlug));
    if (url) {
      await del(url);
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
