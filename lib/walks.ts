import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { list, head, put } from "@vercel/blob";

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

export async function getWalkFromBlob(slug: string): Promise<Walk | null> {
  try {
    const blobUrl = await getBlobUrl(`walks/${slug}.json`);
    if (!blobUrl) return null;

    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) return null;

    const data: WalkData = await response.json();
    const processed = await remark().use(html).process(data.description || "");

    return {
      slug,
      date: data.date || "",
      rating: data.rating || 0,
      weather: data.weather || "",
      photos: data.photos || [],
      contentHtml: processed.toString(),
    };
  } catch {
    return null;
  }
}

export async function saveWalkToBlob(slug: string, data: WalkData): Promise<WalkData> {
  const blob = await put(`walks/${slug}.json`, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  // Return the data as saved (blob.url points to the file)
  void blob;
  return data;
}

export async function getWalkDataFromBlob(slug: string): Promise<WalkData | null> {
  try {
    const blobUrl = await getBlobUrl(`walks/${slug}.json`);
    if (!blobUrl) return null;

    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

async function getBlobUrl(pathname: string): Promise<string | null> {
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

export async function getCompletedBlobSlugs(): Promise<string[]> {
  try {
    const result = await list({ prefix: "walks/" });
    return result.blobs
      .map((b) => {
        const match = b.pathname.match(/^walks\/(.+)\.json$/);
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

export async function getWalkBySlug(slug: string): Promise<Walk | null> {
  // Try blob first
  const blobWalk = await getWalkFromBlob(slug);
  if (blobWalk) return blobWalk;

  // Fall back to markdown
  return getWalkFromMarkdown(slug);
}

export async function getAllCompletedSlugs(): Promise<string[]> {
  const mdSlugs = getCompletedSlugs();
  const blobSlugs = await getCompletedBlobSlugs();
  return [...new Set([...mdSlugs, ...blobSlugs])];
}
