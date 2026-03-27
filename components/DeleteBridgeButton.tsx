"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteBridgeButtonProps {
  citySlug: string;
  bridgeSlug: string;
}

export default function DeleteBridgeButton({ citySlug, bridgeSlug }: DeleteBridgeButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cities/${citySlug}/bridges`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bridgeSlug }),
      });
      if (res.ok) {
        router.push(`/?city=${citySlug}`);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--muted)]">Delete this bridge?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-[var(--muted)] hover:text-red-500 transition-colors"
    >
      Delete bridge
    </button>
  );
}
