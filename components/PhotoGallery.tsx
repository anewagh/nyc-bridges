"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  slug: string;
  photos: string[];
}

function photoSrc(slug: string, photo: string): string {
  // Proxy URLs (/api/...) and full URLs (http...) pass through
  if (photo.startsWith("/") || photo.startsWith("http")) return photo;
  // Local filenames resolve to /photos/slug/filename
  return `/photos/${slug}/${photo}`;
}

function shouldSkipOptimization(photo: string): boolean {
  return photo.startsWith("http") || photo.startsWith("/api/");
}

export default function PhotoGallery({ slug, photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <button
            key={`${photo}-${i}`}
            onClick={() => setSelected(photo)}
            className="aspect-square relative rounded-lg overflow-hidden bg-[var(--card-border)] hover:ring-2 ring-[var(--accent)] transition-all"
          >
            <Image
              src={photoSrc(slug, photo)}
              alt={`${slug} - photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
              unoptimized={shouldSkipOptimization(photo)}
            />
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full">
            <Image
              src={photoSrc(slug, selected)}
              alt={selected}
              fill
              className="object-contain"
              sizes="90vw"
              unoptimized={shouldSkipOptimization(selected)}
            />
          </div>
        </div>
      )}
    </>
  );
}
