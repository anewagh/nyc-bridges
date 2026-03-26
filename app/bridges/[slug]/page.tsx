import { redirect, notFound } from "next/navigation";
import { getBridgeBySlug } from "@/lib/bridges";

export default async function LegacyBridgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bridge = getBridgeBySlug(slug);
  if (bridge) redirect(`/bridges/nyc/${slug}`);
  notFound();
}
