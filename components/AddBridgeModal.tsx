"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface WikiResult {
  title: string;
  description: string;
  url: string;
}

interface AddBridgeModalProps {
  citySlug: string;
  open: boolean;
  onClose: () => void;
}

export default function AddBridgeModal({ citySlug, open, onClose }: AddBridgeModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [region, setRegion] = useState("");
  const [funFacts, setFunFacts] = useState<string[]>([""]);
  const [wikipediaUrl, setWikipediaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [populated, setPopulated] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Debounced Wikipedia search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/wikipedia?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function selectResult(result: WikiResult) {
    setShowResults(false);
    setQuery(result.title);
    setName(result.title);

    try {
      const res = await fetch(
        `/api/wikipedia/summary?title=${encodeURIComponent(result.title)}`
      );
      const data = await res.json();

      if (data.yearBuilt) setYearBuilt(String(data.yearBuilt));
      if (data.distance) setDistance(data.distance);
      if (data.funFacts?.length) setFunFacts(data.funFacts);
      if (data.wikipediaUrl) setWikipediaUrl(data.wikipediaUrl);
      setPopulated(true);
    } catch {
      // Auto-populate failed, user can fill in manually
    }
  }

  function updateFunFact(index: number, value: string) {
    const updated = [...funFacts];
    updated[index] = value;
    setFunFacts(updated);
  }

  function addFunFact() {
    setFunFacts([...funFacts, ""]);
  }

  function removeFunFact(index: number) {
    setFunFacts(funFacts.filter((_, i) => i !== index));
  }

  function resetForm() {
    setQuery("");
    setName("");
    setFrom("");
    setTo("");
    setDistance("");
    setYearBuilt("");
    setRegion("");
    setFunFacts([""]);
    setWikipediaUrl("");
    setPopulated(false);
    setResults([]);
    setShowResults(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/cities/${citySlug}/bridges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          from: from.trim(),
          to: to.trim(),
          distance: distance.trim(),
          yearBuilt: yearBuilt ? parseInt(yearBuilt) : 0,
          region: region.trim() || "General",
          funFacts: funFacts.filter((f) => f.trim()),
          wikipediaUrl,
        }),
      });

      if (res.ok) {
        resetForm();
        onClose();
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 w-full max-w-lg shadow-lg mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-bold mb-4">Add a Bridge</h2>

        {/* Wikipedia search */}
        <div className="relative mb-4">
          <label className="block text-sm font-medium mb-1">Search Wikipedia</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Golden Gate Bridge"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          {searching && (
            <span className="absolute right-3 top-8 text-xs text-[var(--muted)]">Searching...</span>
          )}

          {showResults && results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--accent-light)] transition-colors border-b border-[var(--card-border)] last:border-b-0"
                >
                  <div className="text-sm font-medium">{r.title}</div>
                  {r.description && (
                    <div className="text-xs text-[var(--muted)] truncate">{r.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {populated && (
          <p className="text-xs text-[var(--success)] mb-4">
            Auto-populated from Wikipedia. Edit any field below.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bridge Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Neighborhood / area"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Neighborhood / area"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Distance</label>
              <input
                type="text"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="1.2 mi"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year Built</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="1937"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Bay Area"
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fun Facts</label>
            <div className="space-y-2">
              {funFacts.map((fact, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={fact}
                    onChange={(e) => updateFunFact(i, e.target.value)}
                    placeholder={`Fun fact ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  {funFacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFunFact(i)}
                      className="text-[var(--muted)] hover:text-red-500 transition-colors px-2"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFunFact}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                + Add another fact
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Bridge"}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
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
