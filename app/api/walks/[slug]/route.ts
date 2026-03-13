import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getWalkBySlug, getWalkDataFromBlob, saveWalkToBlob } from "@/lib/walks";
import type { WalkData } from "@/lib/walks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const debug = request.nextUrl.searchParams.get("debug") === "1";

  if (debug) {
    // List all blobs to see what's stored
    const allBlobs = await list({});
    const walkBlobs = await list({ prefix: `walks/${slug}` });
    return NextResponse.json({
      allBlobCount: allBlobs.blobs.length,
      allBlobs: allBlobs.blobs.map((b) => ({ pathname: b.pathname, url: b.url })),
      walkBlobs: walkBlobs.blobs.map((b) => ({ pathname: b.pathname, url: b.url, downloadUrl: b.downloadUrl })),
    });
  }

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
    const data: WalkData = {
      date: body.date || "",
      rating: Number(body.rating) || 0,
      weather: body.weather || "",
      description: body.description || "",
      photos: body.photos ?? existing?.photos ?? [],
    };

    const saved = await saveWalkToBlob(slug, data);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
