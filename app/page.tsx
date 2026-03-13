import { getAllBridges } from "@/lib/bridges";
import { getCompletedSlugs, getWalkBySlug } from "@/lib/walks";
import ProgressRing from "@/components/ProgressRing";
import BridgeCard from "@/components/BridgeCard";

export default async function Home() {
  const bridges = getAllBridges();
  const completedSlugs = getCompletedSlugs();

  const walkDates: Record<string, string> = {};
  for (const slug of completedSlugs) {
    const walk = await getWalkBySlug(slug);
    if (walk) walkDates[slug] = walk.date;
  }

  const completed = bridges.filter((b) => completedSlugs.includes(b.slug));
  const remaining = bridges.filter((b) => !completedSlugs.includes(b.slug));

  return (
    <div>
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          NYC Bridge Walks
        </h1>
        <p className="text-[var(--muted)] mb-8">
          Walking every major bridge in New York City, one crossing at a time.
        </p>
        <ProgressRing completed={completed.length} total={bridges.length} />
      </section>

      {completed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold mb-4">
            Completed ({completed.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {completed.map((bridge) => (
              <BridgeCard
                key={bridge.slug}
                bridge={bridge}
                completed={true}
                walkDate={walkDates[bridge.slug]}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-4">
          Remaining ({remaining.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {remaining.map((bridge) => (
            <BridgeCard
              key={bridge.slug}
              bridge={bridge}
              completed={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
