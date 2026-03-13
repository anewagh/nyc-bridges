import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const walksDirectory = path.join(process.cwd(), "content/walks");

export interface Walk {
  slug: string;
  date: string;
  rating: number;
  weather: string;
  photos: string[];
  contentHtml: string;
}

export function getCompletedSlugs(): string[] {
  if (!fs.existsSync(walksDirectory)) return [];
  return fs
    .readdirSync(walksDirectory)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export async function getWalkBySlug(slug: string): Promise<Walk | null> {
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
