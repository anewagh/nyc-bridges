"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteCityButtonProps {
  citySlug: string;
  cityName: string;
}

export default function DeleteCityButton({ citySlug, cityName }: DeleteCityButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/cities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: citySlug }),
      });
      if (res.ok) {
        router.push("/?city=nyc");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirming(false)}>
        <div
          className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 w-full max-w-xs shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm mb-4">
            Delete <strong>{cityName}</strong> and all its bridges?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setConfirming(true);
      }}
      className="text-sm text-[var(--muted)] hover:text-red-500 transition-colors"
      title={`Delete ${cityName}`}
    >
      &times;
    </button>
  );
}
