import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBridges, getBridgeBySlug } from "@/lib/bridges";
import { getWalkBySlug, getWalkDataFromBlob } from "@/lib/walks";
import BridgeWalkClient from "@/components/BridgeWalkClient";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getAllBridges().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bridge = getBridgeBySlug(slug);
  return { title: bridge ? `${bridge.name} | NYC Bridge Walks` : "Bridge Not Found" };
}

export default async function BridgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bridge = getBridgeBySlug(slug);
  if (!bridge) notFound();

  const walk = await getWalkBySlug(slug);

  // Also get raw description for edit form pre-fill
  const blobData = await getWalkDataFromBlob(slug);
  const walkWithDescription = walk ? {
    ...walk,
    description: blobData?.description || "",
  } : null;

  return (
    <div>
      <Link
        href="/"
        className="text-sm text-[var(--accent)] hover:underline mb-6 inline-block"
      >
        &larr; All bridges
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bridge.name}</h1>
          <p className="text-[var(--muted)] mt-1">
            {bridge.from} &rarr; {bridge.to}
          </p>
        </div>
        {walk ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--success)] text-white text-sm font-medium flex-shrink-0">
            &#10003; Walked
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--card-border)] text-[var(--muted)] text-sm flex-shrink-0">
            Not yet
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--muted)] mb-6 pb-6 border-b border-[var(--card-border)]">
        <span>{bridge.region}</span>
        <span>Distance: {bridge.distance}</span>
        <span>Built: {bridge.yearBuilt}</span>
        {walk && (
          <>
            <span>
              Walked:{" "}
              {new Date(walk.date + "T12:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {walk.weather && <span>Weather: {walk.weather}</span>}
          </>
        )}
      </div>

      {bridge.funFacts && bridge.funFacts.length > 0 && (
        <div className="mb-8 p-4 rounded-lg bg-[var(--accent-light)] border border-[var(--card-border)]">
          <h3 className="text-sm font-semibold mb-2">Fun Facts</h3>
          <ul className="space-y-1.5">
            {bridge.funFacts.map((fact, i) => (
              <li key={i} className="text-sm text-[var(--foreground)] leading-relaxed">
                &bull; {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BridgeWalkClient slug={slug} walk={walkWithDescription} />
    </div>
  );
}
