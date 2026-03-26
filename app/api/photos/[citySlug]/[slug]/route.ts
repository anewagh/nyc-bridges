import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getWalkDataFromBlob, saveWalkToBlob, photoBlobPrefix } from "@/lib/walks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ citySlug: string; slug: string }> }
) {
  const { citySlug, slug } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const prefix = photoBlobPrefix(slug, citySlug);
    const blob = await put(`${prefix}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const existing = await getWalkDataFromBlob(slug, citySlug);
    if (existing) {
      const photos = existing.photos || [];
      if (!photos.includes(blob.url)) {
        photos.push(blob.url);
        await saveWalkToBlob(slug, { ...existing, photos }, citySlug);
      }
    }

    return NextResponse.json({ url: blob.downloadUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
