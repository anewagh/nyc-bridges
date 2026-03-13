"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EditWalkForm from "./EditWalkForm";
import PhotoGallery from "./PhotoGallery";

interface WalkDisplay {
  date: string;
  rating: number;
  weather: string;
  photos: string[];
  contentHtml: string;
  description?: string;
}

interface BridgeWalkClientProps {
  slug: string;
  walk: WalkDisplay | null;
}

export default function BridgeWalkClient({ slug, walk }: BridgeWalkClientProps) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {walk ? "Edit Walk" : "Log This Walk"}
        </h2>
        <EditWalkForm
          slug={slug}
          initial={walk ? {
            date: walk.date,
            rating: walk.rating,
            weather: walk.weather,
            description: walk.description || "",
            photos: walk.photos,
          } : undefined}
          onSaved={handleSaved}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  if (walk) {
    return (
      <div className="space-y-8">
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)] transition-colors"
          >
            Edit
          </button>
        </div>

        {walk.photos.length > 0 && (
          <PhotoGallery slug={slug} photos={walk.photos} />
        )}

        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: walk.contentHtml }}
        />

        {walk.rating > 0 && (
          <div className="pt-4 border-t border-[var(--card-border)]">
            <span className="text-sm text-[var(--muted)]">Rating: </span>
            <span className="text-lg">
              {"★".repeat(walk.rating)}
              {"☆".repeat(5 - walk.rating)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-4">🌉</p>
      <p className="text-lg text-[var(--muted)] mb-4">
        Haven&apos;t walked this one yet.
      </p>
      <button
        onClick={() => setEditing(true)}
        className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
      >
        Log This Walk
      </button>
    </div>
  );
}
