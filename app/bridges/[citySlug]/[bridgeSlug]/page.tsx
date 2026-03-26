import { notFound } from "next/navigation";
import Link from "next/link";
import { getBridgesForCity, getBridgeBySlugAndCity } from "@/lib/bridges";
import { getWalkBySlug, getWalkDataFromBlob } from "@/lib/walks";
import BridgeWalkClient from "@/components/BridgeWalkClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; bridgeSlug: string }>;
}) {
  const { citySlug, bridgeSlug } = await params;
  const bridges = await getBridgesForCity(citySlug);
  const bridge = getBridgeBySlugAndCity(citySlug, bridges, bridgeSlug);
  return {
    title: bridge
      ? `${bridge.name} | Bridge Walks`
      : "Bridge Not Found",
  };
}

export default async function BridgePage({
  params,
}: {
  params: Promise<{ citySlug: string; bridgeSlug: string }>;
}) {
  const { citySlug, bridgeSlug } = await params;
  const bridges = await getBridgesForCity(citySlug);
  const bridge = getBridgeBySlugAndCity(citySlug, bridges, bridgeSlug);
  if (!bridge) notFound();

  let walk = null;
  let blobData = null;
  try {
    walk = await getWalkBySlug(bridgeSlug, citySlug);
    blobData = await getWalkDataFromBlob(bridgeSlug, citySlug);
  } catch {
    // If blob fetch fails, continue with null walk data
  }
  const walkWithDescription = walk
    ? {
        ...walk,
        description: blobData?.description || "",
      }
    : null;

  return (
    <div>
      <Link
        href={`/?city=${citySlug}`}
        className="text-sm text-[var(--accent)] hover:underline mb-6 inline-block"
      >
        &larr; All bridges
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {bridge.name}
          </h1>
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

      <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)] mb-6 pb-6 border-b border-dashed border-[var(--accent)] border-opacity-30">
        <span>{bridge.region}</span>
        <span className="text-[var(--accent)] opacity-40">&middot;</span>
        <span>{bridge.distance}</span>
        <span className="text-[var(--accent)] opacity-40">&middot;</span>
        <span>Built {bridge.yearBuilt}</span>
        {walk && (
          <>
            {walk.date && (
              <>
                <span className="text-[var(--accent)] opacity-40">
                  &middot;
                </span>
                <span>
                  Walked{" "}
                  {new Date(walk.date + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
              </>
            )}
            {walk.weather && (
              <>
                <span className="text-[var(--accent)] opacity-40">
                  &middot;
                </span>
                <span>{walk.weather}</span>
              </>
            )}
          </>
        )}
      </div>

      {bridge.funFacts && bridge.funFacts.length > 0 && (
        <div className="mb-8 p-5 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)] border-opacity-20">
          <h3 className="font-serif text-sm font-bold mb-2">Fun Facts</h3>
          <ul className="space-y-1.5">
            {bridge.funFacts.map((fact, i) => (
              <li
                key={i}
                className="text-sm text-[var(--foreground)] leading-relaxed"
              >
                &bull; {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BridgeWalkClient
        slug={bridgeSlug}
        citySlug={citySlug}
        walk={walkWithDescription}
      />
    </div>
  );
}
