"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddCityModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddCityModal({ open, onClose }: AddCityModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const city = await res.json();
        setName("");
        onClose();
        router.push(`/?city=${city.slug}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-bold mb-4">Add a City</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">City Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="San Francisco"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add City"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
