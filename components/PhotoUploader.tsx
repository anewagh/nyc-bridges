"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface PhotoUploaderProps {
  slug: string;
  citySlug: string;
  photos: string[];
  onUploaded: (url: string) => void;
}

export default function PhotoUploader({ slug, citySlug, photos, onUploaded }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/photos/${citySlug}/${slug}`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        onUploaded(url);
      }
    } finally {
      setUploading(false);
    }
  }, [slug, onUploaded]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  function photoSrc(photo: string): string {
    if (photo.startsWith("/") || photo.startsWith("http")) return photo;
    return `/photos/${slug}/${photo}`;
  }

  return (
    <div className="space-y-3">
      {/* Existing photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="aspect-square relative rounded-lg overflow-hidden bg-[var(--card-border)]">
              <Image
                src={photoSrc(photo)}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, 25vw"
                unoptimized={photo.startsWith("http") || photo.includes("/api/")}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--card-border)] hover:border-[var(--muted)]"
          }
        `}
      >
        {uploading ? (
          <p className="text-sm text-[var(--muted)]">Uploading...</p>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)]">
              Drop a photo here or click to browse
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              JPG, PNG, WebP
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
