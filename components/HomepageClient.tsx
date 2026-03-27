"use client";

import { useState } from "react";
import type { City, Bridge } from "@/lib/types";
import CityTabs from "./CityTabs";
import AddCityModal from "./AddCityModal";
import AddBridgeModal from "./AddBridgeModal";
import ProgressRing from "./ProgressRing";
import BridgeCard from "./BridgeCard";

interface RegionGroup {
  region: string;
  bridges: Bridge[];
}

interface HomepageClientProps {
  cities: City[];
  currentCity: string;
  regions: RegionGroup[];
  completedSlugs: string[];
  walkDates: Record<string, string>;
  completedMiles: number;
  totalMiles: number;
  totalBridges: number;
}

export default function HomepageClient({
  cities,
  currentCity,
  regions,
  completedSlugs,
  walkDates,
  completedMiles,
  totalMiles,
  totalBridges,
}: HomepageClientProps) {
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddBridge, setShowAddBridge] = useState(false);

  const currentCityData = cities.find((c) => c.slug === currentCity);
  const cityName = currentCityData?.name || currentCity;

  return (
    <div>
      <CityTabs
        cities={cities}
        currentCity={currentCity}
        onAddCity={() => setShowAddCity(true)}
      />

      <section className="text-center py-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-3">
          {cityName} Bridge Walks
        </h1>
        <p className="font-serif italic text-[var(--muted)] text-lg mb-8">
          taking the scenic route, looking down on cities & people
        </p>
        <ProgressRing
          completed={completedSlugs.length}
          total={totalBridges}
          completedMiles={completedMiles}
          totalMiles={totalMiles}
        />
      </section>

      {regions.map(({ region, bridges: regionBridges }) => {
        const completedCount = regionBridges.filter((b) =>
          completedSlugs.includes(b.slug)
        ).length;

        return (
          <section key={region} className="mt-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-serif text-lg font-bold">{region}</h2>
              <span className="text-sm text-[var(--muted)]">
                {completedCount}/{regionBridges.length}
              </span>
              <span className="flex-1 border-b border-dashed border-[var(--accent)] opacity-30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regionBridges.map((bridge) => {
                const isCompleted = completedSlugs.includes(bridge.slug);
                return (
                  <BridgeCard
                    key={bridge.slug}
                    bridge={bridge}
                    citySlug={currentCity}
                    completed={isCompleted}
                    walkDate={isCompleted ? walkDates[bridge.slug] : undefined}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {totalBridges === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--muted)] mb-4">
            No bridges yet. Add your first bridge to get started.
          </p>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={() => setShowAddBridge(true)}
          className="px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          + Add Bridge
        </button>
      </div>

      <AddCityModal open={showAddCity} onClose={() => setShowAddCity(false)} />
      <AddBridgeModal
        citySlug={currentCity}
        open={showAddBridge}
        onClose={() => setShowAddBridge(false)}
      />
    </div>
  );
}
