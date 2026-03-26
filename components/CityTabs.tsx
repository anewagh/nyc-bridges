"use client";

import Link from "next/link";
import type { City } from "@/lib/types";

interface CityTabsProps {
  cities: City[];
  currentCity: string;
  onAddCity: () => void;
}

export default function CityTabs({ cities, currentCity, onAddCity }: CityTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
      {cities.map((city) => (
        <Link
          key={city.slug}
          href={`/?city=${city.slug}`}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            city.slug === currentCity
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--muted)]"
          }`}
        >
          {city.name}
        </Link>
      ))}
      <button
        onClick={onAddCity}
        className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-dashed border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center text-lg"
        title="Add a city"
      >
        +
      </button>
    </div>
  );
}
