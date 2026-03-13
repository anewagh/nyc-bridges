import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getWalkDataFromBlob, saveWalkToBlob } from "@/lib/walks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
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

    // Store permanent blob.url in walk data (resolved to downloadUrl at render time)
    const existing = await getWalkDataFromBlob(slug);
    if (existing) {
      const photos = existing.photos || [];
      if (!photos.includes(blob.url)) {
        photos.push(blob.url);
        await saveWalkToBlob(slug, { ...existing, photos });
      }
    }

    // Return downloadUrl for immediate display in the browser
    return NextResponse.json({ url: blob.downloadUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
