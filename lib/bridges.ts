import bridgesData from "@/data/bridges.json";

export interface Bridge {
  slug: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  yearBuilt: number;
  region: string;
  funFacts?: string[];
}

const REGION_ORDER = [
  "East River",
  "Harlem River",
  "Hudson River",
  "Brooklyn\u2013Queens / Newtown Creek",
  "Queens / Other",
];

export function getAllBridges(): Bridge[] {
  return bridgesData as Bridge[];
}

export function getBridgeBySlug(slug: string): Bridge | undefined {
  return getAllBridges().find((b) => b.slug === slug);
}

export function getBridgesByRegion(): { region: string; bridges: Bridge[] }[] {
  const all = getAllBridges();
  const grouped = new Map<string, Bridge[]>();

  for (const bridge of all) {
    const list = grouped.get(bridge.region) || [];
    list.push(bridge);
    grouped.set(bridge.region, list);
  }

  return REGION_ORDER
    .filter((r) => grouped.has(r))
    .map((region) => ({ region, bridges: grouped.get(region)! }));
}
