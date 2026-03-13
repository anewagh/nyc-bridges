"use client";

import { useState } from "react";
import PhotoUploader from "./PhotoUploader";

interface EditWalkFormProps {
  slug: string;
  initial?: {
    date: string;
    rating: number;
    weather: string;
    description: string;
    photos: string[];
  };
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditWalkForm({ slug, initial, onSaved, onCancel }: EditWalkFormProps) {
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [rating, setRating] = useState(initial?.rating || 5);
  const [weather, setWeather] = useState(initial?.weather || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos || []);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/walks/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, rating, weather, description, photos }),
      });

      if (res.ok) {
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoUploaded(url: string) {
    setPhotos((prev) => [...prev, url]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weather</label>
          <input
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder="Sunny, 52F"
            className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <div className="flex gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-2xl leading-none hover:scale-110 transition-transform"
              >
                {star <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="How was the walk? What did you see?"
          className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        <PhotoUploader slug={slug} photos={photos} onUploaded={handlePhotoUploaded} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Walk"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
