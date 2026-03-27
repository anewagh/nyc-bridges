import bridgesData from "@/data/bridges.json";
import { del, list, put } from "@vercel/blob";
import type { City, Bridge } from "./types";

export type { Bridge } from "./types";

// Re-export for backward compat
export type { City } from "./types";

// --- NYC static data ---

function getNycBridges(): Bridge[] {
  return (bridgesData as Omit<Bridge, "city">[]).map((b) => ({
    ...b,
    city: "nyc",
  }));
}

// --- Blob helpers ---

async function fetchBlob(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN || ""}`,
    },
  });
}

async function findBlobUrl(pathname: string): Promise<string | null> {
  try {
    const result = await list({ prefix: pathname, limit: 1 });
    return result.blobs.length > 0 ? result.blobs[0].url : null;
  } catch {
    return null;
  }
}

// --- City functions ---

const NYC_CITY: City = { slug: "nyc", name: "New York City", isBuiltIn: true };

export async function getAllCities(): Promise<City[]> {
  const userCities = await getUserCities();
  return [NYC_CITY, ...userCities];
}

async function getUserCities(): Promise<City[]> {
  try {
    const blobUrl = await findBlobUrl("cities/index.json");
    if (!blobUrl) return [];
    const res = await fetchBlob(blobUrl);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addCity(name: string): Promise<City> {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const existing = await getUserCities();
  const city: City = { slug, name, isBuiltIn: false };

  if (!existing.find((c) => c.slug === slug)) {
    existing.push(city);
    await put("cities/index.json", JSON.stringify(existing), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }

  return city;
}

export async function deleteCity(slug: string): Promise<boolean> {
  if (slug === "nyc") return false; // NYC is read-only
  const existing = await getUserCities();
  const filtered = existing.filter((c) => c.slug !== slug);
  if (filtered.length === existing.length) return false;

  // Delete old cities index blob first
  const oldIndexUrl = await findBlobUrl("cities/index.json");
  if (oldIndexUrl) {
    await del(oldIndexUrl);
  }

  // Write updated cities index
  if (filtered.length > 0) {
    await put("cities/index.json", JSON.stringify(filtered), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }

  // Delete city's bridges blob
  const bridgesBlobUrl = await findBlobUrl(`cities/${slug}/bridges.json`);
  if (bridgesBlobUrl) {
    await del(bridgesBlobUrl);
  }

  return true;
}

// --- Bridge functions ---

export async function getBridgesForCity(citySlug: string): Promise<Bridge[]> {
  if (citySlug === "nyc") {
    return getNycBridges();
  }

  try {
    const blobUrl = await findBlobUrl(`cities/${citySlug}/bridges.json`);
    if (!blobUrl) return [];
    const res = await fetchBlob(blobUrl);
    if (!res.ok) return [];
    const bridges: Bridge[] = await res.json();
    return bridges.map((b) => ({ ...b, city: citySlug }));
  } catch {
    return [];
  }
}

export async function addBridgeToCity(
  citySlug: string,
  bridge: Omit<Bridge, "city">
): Promise<Bridge> {
  const existing = await getBridgesForCity(citySlug);
  const newBridge: Bridge = { ...bridge, city: citySlug, isUserAdded: true };

  if (!existing.find((b) => b.slug === newBridge.slug)) {
    existing.push(newBridge);
  }

  await put(
    `cities/${citySlug}/bridges.json`,
    JSON.stringify(existing),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    }
  );

  return newBridge;
}

export async function deleteBridgeFromCity(
  citySlug: string,
  bridgeSlug: string
): Promise<boolean> {
  if (citySlug === "nyc") return false;
  const bridges = await getBridgesForCity(citySlug);
  const filtered = bridges.filter((b) => b.slug !== bridgeSlug);
  if (filtered.length === bridges.length) return false;

  const oldBlobUrl = await findBlobUrl(`cities/${citySlug}/bridges.json`);
  if (oldBlobUrl) await del(oldBlobUrl);

  if (filtered.length > 0) {
    await put(`cities/${citySlug}/bridges.json`, JSON.stringify(filtered), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }
  return true;
}

export function getBridgeBySlugAndCity(
  citySlug: string,
  bridges: Bridge[],
  bridgeSlug: string
): Bridge | undefined {
  return bridges.find((b) => b.slug === bridgeSlug && b.city === citySlug);
}

// --- Legacy functions (NYC only, backward compat) ---

export function getAllBridges(): Bridge[] {
  return getNycBridges();
}

export function getBridgeBySlug(slug: string): Bridge | undefined {
  return getNycBridges().find((b) => b.slug === slug);
}

export function getBridgesByRegion(
  bridges?: Bridge[]
): { region: string; bridges: Bridge[] }[] {
  const all = bridges ?? getNycBridges();
  const grouped = new Map<string, Bridge[]>();

  for (const bridge of all) {
    const list = grouped.get(bridge.region) || [];
    list.push(bridge);
    grouped.set(bridge.region, list);
  }

  // Sort regions in order of first appearance
  const regionOrder: string[] = [];
  for (const bridge of all) {
    if (!regionOrder.includes(bridge.region)) {
      regionOrder.push(bridge.region);
    }
  }

  return regionOrder
    .filter((r) => grouped.has(r))
    .map((region) => ({ region, bridges: grouped.get(region)! }));
}
