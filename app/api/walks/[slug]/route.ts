import { NextRequest, NextResponse } from "next/server";
import { getWalkBySlug, getWalkDataFromBlob, saveWalkToBlob } from "@/lib/walks";
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

  // Convert Walk to WalkData format (strip HTML, return raw description placeholder)
  return NextResponse.json({
    date: walk.date,
    rating: walk.rating,
    weather: walk.weather,
    description: "", // markdown content is HTML — editing replaces it
    photos: walk.photos,
  } satisfies WalkData);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  // Merge with existing blob data to preserve photos
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
}
