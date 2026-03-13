"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  slug: string;
  photos: string[];
}

export default function PhotoGallery({ slug, photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <button
            key={photo}
            onClick={() => setSelected(photo)}
            className="aspect-square relative rounded-lg overflow-hidden bg-[var(--card-border)] hover:ring-2 ring-[var(--accent)] transition-all"
          >
            <Image
              src={`/photos/${slug}/${photo}`}
              alt={`${slug} - ${photo}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
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
              src={`/photos/${slug}/${selected}`}
              alt={selected}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
