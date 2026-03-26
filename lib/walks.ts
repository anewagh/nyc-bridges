import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { list, put } from "@vercel/blob";

const walksDirectory = path.join(process.cwd(), "content/walks");

export interface Walk {
  slug: string;
  date: string;
  rating: number;
  weather: string;
  photos: string[];
  contentHtml: string;
}

export interface WalkData {
  date: string;
  rating: number;
  weather: string;
  description: string;
  photos: string[];
}

// --- Blob storage helpers ---

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

async function fetchBlob(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${blobToken()}` },
  });
}

function cleanPhotoUrl(url: string): string {
  if (url.startsWith("/api/blob-image?url=")) {
    const decoded = decodeURIComponent(url.replace("/api/blob-image?url=", ""));
    return decoded.replace(/\?download=1$/, "");
  }
  return url;
}

function resolvePhotoUrls(photos: string[]): string[] {
  return photos.map((photo) => {
    if (photo.includes("blob.vercel-storage.com")) {
      return `/api/blob-image?url=${encodeURIComponent(photo)}`;
    }
    return photo;
  });
}

function walkBlobPath(bridgeSlug: string, citySlug?: string): string {
  if (!citySlug || citySlug === "nyc") return `walks/${bridgeSlug}.json`;
  return `walks/${citySlug}/${bridgeSlug}.json`;
}

function photoBlobPrefix(bridgeSlug: string, citySlug?: string): string {
  if (!citySlug || citySlug === "nyc") return `photos/${bridgeSlug}`;
  return `photos/${citySlug}/${bridgeSlug}`;
}

export async function getWalkFromBlob(slug: string, citySlug?: string): Promise<Walk | null> {
  try {
    const blobUrl = await findBlobUrl(walkBlobPath(slug, citySlug));
    if (!blobUrl) return null;

    const response = await fetchBlob(blobUrl);
    if (!response.ok) return null;

    const data: WalkData = await response.json();
    const processed = await remark().use(html).process(data.description || "");
    const resolvedPhotos = await resolvePhotoUrls(data.photos || []);

    return {
      slug,
      date: data.date || "",
      rating: data.rating || 0,
      weather: data.weather || "",
      photos: resolvedPhotos,
      contentHtml: processed.toString(),
    };
  } catch {
    return null;
  }
}

export async function saveWalkToBlob(slug: string, data: WalkData, citySlug?: string): Promise<WalkData> {
  await put(walkBlobPath(slug, citySlug), JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return data;
}

export async function getWalkDataFromBlob(slug: string, citySlug?: string): Promise<WalkData | null> {
  try {
    const blobUrl = await findBlobUrl(walkBlobPath(slug, citySlug));
    if (!blobUrl) return null;

    const response = await fetchBlob(blobUrl);
    if (!response.ok) return null;

    const data: WalkData = await response.json();
    // Normalize any corrupted proxy URLs back to raw blob URLs
    data.photos = (data.photos || []).map(cleanPhotoUrl);
    return data;
  } catch {
    return null;
  }
}

export async function findBlobUrl(pathname: string): Promise<string | null> {
  try {
    const result = await list({ prefix: pathname, limit: 1 });
    if (result.blobs.length > 0) {
      return result.blobs[0].url;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCompletedBlobSlugs(citySlug?: string): Promise<string[]> {
  try {
    const prefix = (!citySlug || citySlug === "nyc") ? "walks/" : `walks/${citySlug}/`;
    const result = await list({ prefix });
    return result.blobs
      .map((b) => {
        if (!citySlug || citySlug === "nyc") {
          // NYC: walks/brooklyn-bridge.json → brooklyn-bridge (skip nested paths)
          const match = b.pathname.match(/^walks\/([^/]+)\.json$/);
          return match ? match[1] : null;
        }
        // Other cities: walks/chicago/bridge-name.json → bridge-name
        const match = b.pathname.match(/^walks\/[^/]+\/([^/]+)\.json$/);
        return match ? match[1] : null;
      })
      .filter((s): s is string => s !== null);
  } catch {
    return [];
  }
}

// --- Markdown helpers (unchanged, used as fallback) ---

export function getCompletedSlugs(): string[] {
  if (!fs.existsSync(walksDirectory)) return [];
  return fs
    .readdirSync(walksDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

async function getWalkFromMarkdown(slug: string): Promise<Walk | null> {
  const filePath = path.join(walksDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    slug,
    date: data.date || "",
    rating: data.rating || 0,
    weather: data.weather || "",
    photos: data.photos || [],
    contentHtml,
  };
}

// --- Public API: blob-first, markdown fallback ---

export async function getWalkBySlug(slug: string, citySlug?: string): Promise<Walk | null> {
  const blobWalk = await getWalkFromBlob(slug, citySlug);
  if (blobWalk) return blobWalk;
  if (!citySlug || citySlug === "nyc") {
    return getWalkFromMarkdown(slug);
  }
  return null;
}

export async function getAllCompletedSlugs(citySlug?: string): Promise<string[]> {
  const blobSlugs = await getCompletedBlobSlugs(citySlug);
  if (!citySlug || citySlug === "nyc") {
    const mdSlugs = getCompletedSlugs();
    return [...new Set([...mdSlugs, ...blobSlugs])];
  }
  return blobSlugs;
}

// Export for API routes
export { walkBlobPath, photoBlobPrefix };
