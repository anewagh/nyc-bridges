import bridgesData from "@/data/bridges.json";

export interface Bridge {
  slug: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  yearBuilt: number;
}

export function getAllBridges(): Bridge[] {
  return bridgesData as Bridge[];
}

export function getBridgeBySlug(slug: string): Bridge | undefined {
  return getAllBridges().find((b) => b.slug === slug);
}
