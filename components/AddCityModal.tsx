"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface WikiResult {
  title: string;
  description: string;
}

interface BridgeResult {
  name: string;
  yearBuilt: number | null;
  distance: string | null;
  funFacts: string[];
  wikipediaUrl: string;
  selected: boolean;
}

interface AddCityModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddCityModal({ open, onClose }: AddCityModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const [cityName, setCityName] = useState("");
  const [selectedFromWiki, setSelectedFromWiki] = useState(false);

  const [bridges, setBridges] = useState<BridgeResult[]>([]);
  const [loadingBridges, setLoadingBridges] = useState(false);

  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Debounced Wikipedia city search
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
        const res = await fetch(`/api/wikipedia/cities?q=${encodeURIComponent(query)}`);
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

  async function selectCity(result: WikiResult) {
    setShowResults(false);
    setQuery(result.title);
    setCityName(result.title);
    setSelectedFromWiki(true);

    // Auto-search for bridges in this city
    setLoadingBridges(true);
    try {
      const res = await fetch(
        `/api/wikipedia/city-bridges?city=${encodeURIComponent(result.title)}`
      );
      const data = await res.json();
      setBridges(
        (data.bridges || []).map((b: Omit<BridgeResult, "selected">) => ({
          ...b,
          selected: true,
        }))
      );
    } catch {
      setBridges([]);
    } finally {
      setLoadingBridges(false);
    }
  }

  function toggleBridge(index: number) {
    setBridges((prev) =>
      prev.map((b, i) => (i === index ? { ...b, selected: !b.selected } : b))
    );
  }

  function resetForm() {
    setQuery("");
    setCityName("");
    setSelectedFromWiki(false);
    setBridges([]);
    setResults([]);
    setShowResults(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = cityName.trim() || query.trim();
    if (!name) return;
    setSaving(true);

    try {
      // Create the city
      const cityRes = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!cityRes.ok) return;
      const city = await cityRes.json();

      // Add selected bridges
      const selectedBridges = bridges.filter((b) => b.selected);
      for (const bridge of selectedBridges) {
        await fetch(`/api/cities/${city.slug}/bridges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: bridge.name,
            from: "",
            to: "",
            distance: bridge.distance || "",
            yearBuilt: bridge.yearBuilt || 0,
            region: "General",
            funFacts: bridge.funFacts || [],
            wikipediaUrl: bridge.wikipediaUrl || "",
          }),
        });
      }

      resetForm();
      onClose();
      router.push(`/?city=${city.slug}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-6 w-full max-w-lg shadow-lg mb-16"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-lg font-bold mb-4">Add a City</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wikipedia city search */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              Search for a city
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCityName("");
                setSelectedFromWiki(false);
                setBridges([]);
              }}
              placeholder="San Francisco, London, Pittsburgh..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {searching && (
              <span className="absolute right-3 top-8 text-xs text-[var(--muted)]">
                Searching...
              </span>
            )}

            {showResults && results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg overflow-hidden">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectCity(r)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--accent-light)] transition-colors border-b border-[var(--card-border)] last:border-b-0"
                  >
                    <div className="text-sm font-medium">{r.title}</div>
                    {r.description && (
                      <div className="text-xs text-[var(--muted)] truncate">
                        {r.description}
                      </div>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCityName(query.trim());
                    setShowResults(false);
                    setSelectedFromWiki(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--accent-light)] transition-colors text-sm text-[var(--accent)] font-medium"
                >
                  Use &ldquo;{query.trim()}&rdquo; as custom name
                </button>
              </div>
            )}
          </div>

          {/* Selected city indicator */}
          {selectedFromWiki && cityName && (
            <p className="text-xs text-[var(--success)]">
              Selected: {cityName}
            </p>
          )}

          {/* Loading bridges */}
          {loadingBridges && (
            <div className="text-sm text-[var(--muted)] py-4 text-center">
              Searching Wikipedia for bridges...
            </div>
          )}

          {/* Bridge suggestions */}
          {bridges.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Bridges found ({bridges.filter((b) => b.selected).length}{" "}
                  selected)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setBridges((prev) => {
                      const allSelected = prev.every((b) => b.selected);
                      return prev.map((b) => ({
                        ...b,
                        selected: !allSelected,
                      }));
                    })
                  }
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  {bridges.every((b) => b.selected)
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border border-[var(--card-border)] p-2">
                {bridges.map((bridge, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      bridge.selected
                        ? "bg-[var(--accent-light)]"
                        : "hover:bg-[var(--accent-light)] opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bridge.selected}
                      onChange={() => toggleBridge(i)}
                      className="mt-0.5 accent-[var(--accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {bridge.name}
                      </div>
                      <div className="flex gap-2 text-xs text-[var(--muted)] mt-0.5">
                        {bridge.distance && <span>{bridge.distance}</span>}
                        {bridge.yearBuilt && (
                          <span>Built {bridge.yearBuilt}</span>
                        )}
                      </div>
                      {bridge.funFacts.length > 0 && (
                        <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                          {bridge.funFacts[0]}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* No bridges found message */}
          {selectedFromWiki && !loadingBridges && bridges.length === 0 && (
            <p className="text-xs text-[var(--muted)]">
              No bridges found on Wikipedia for this city. You can add bridges
              manually after creating the city.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || (!cityName.trim() && !query.trim())}
              className="px-5 py-2 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving
                ? "Adding..."
                : bridges.filter((b) => b.selected).length > 0
                  ? `Add City + ${bridges.filter((b) => b.selected).length} Bridge${bridges.filter((b) => b.selected).length !== 1 ? "s" : ""}`
                  : "Add City"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
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
