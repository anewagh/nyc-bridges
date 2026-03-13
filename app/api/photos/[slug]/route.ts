import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getWalkDataFromBlob, saveWalkToBlob } from "@/lib/walks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Upload to Vercel Blob
  const blob = await put(`photos/${slug}/${file.name}`, file, {
    access: "private",
    addRandomSuffix: false,
  });

  // Add photo URL to walk data
  const existing = await getWalkDataFromBlob(slug);
  if (existing) {
    const photos = existing.photos || [];
    if (!photos.includes(blob.url)) {
      photos.push(blob.url);
      await saveWalkToBlob(slug, { ...existing, photos });
    }
  }

  return NextResponse.json({ url: blob.url });
}
