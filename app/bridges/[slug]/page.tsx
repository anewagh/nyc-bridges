import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllBridges, getBridgeBySlug } from "@/lib/bridges";
import { getWalkBySlug } from "@/lib/walks";
import PhotoGallery from "@/components/PhotoGallery";

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

      <div className="flex gap-4 text-sm text-[var(--muted)] mb-8 pb-6 border-b border-[var(--card-border)]">
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

      {walk ? (
        <div className="space-y-8">
          {walk.photos.length > 0 && (
            <PhotoGallery slug={slug} photos={walk.photos} />
          )}

          <article
            className="prose"
            dangerouslySetInnerHTML={{ __html: walk.contentHtml }}
          />

          {walk.rating > 0 && (
            <div className="pt-4 border-t border-[var(--card-border)]">
              <span className="text-sm text-[var(--muted)]">Rating: </span>
              <span className="text-lg">
                {"★".repeat(walk.rating)}
                {"☆".repeat(5 - walk.rating)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🌉</p>
          <p className="text-lg text-[var(--muted)]">
            Haven&apos;t walked this one yet.
          </p>
          <p className="text-sm text-[var(--muted)] mt-2">
            Add a markdown file at{" "}
            <code className="bg-[var(--card-border)] px-1.5 py-0.5 rounded text-xs">
              content/walks/{slug}.md
            </code>{" "}
            to log your walk.
          </p>
        </div>
      )}
    </div>
  );
}
