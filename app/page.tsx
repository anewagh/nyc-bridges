import { getAllBridges, getBridgesByRegion } from "@/lib/bridges";
import { getAllCompletedSlugs, getWalkBySlug } from "@/lib/walks";
import ProgressRing from "@/components/ProgressRing";
import BridgeCard from "@/components/BridgeCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const bridges = getAllBridges();
  const completedSlugs = await getAllCompletedSlugs();
  const regions = getBridgesByRegion();

  const walkDates: Record<string, string> = {};
  for (const slug of completedSlugs) {
    const walk = await getWalkBySlug(slug);
    if (walk) walkDates[slug] = walk.date;
  }

  const parseMiles = (d: string) => parseFloat(d) || 0;
  const totalMiles = bridges.reduce((sum, b) => sum + parseMiles(b.distance), 0);
  const completedMiles = bridges
    .filter((b) => completedSlugs.includes(b.slug))
    .reduce((sum, b) => sum + parseMiles(b.distance), 0);

  return (
    <div>
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          NYC Bridge Walks
        </h1>
        <p className="text-[var(--muted)] mb-8">
          Walking every major bridge in New York City, one crossing at a time.
        </p>
        <ProgressRing
          completed={completedSlugs.length}
          total={bridges.length}
          completedMiles={completedMiles}
          totalMiles={totalMiles}
        />
      </section>

      {regions.map(({ region, bridges: regionBridges }) => {
        const completedCount = regionBridges.filter((b) =>
          completedSlugs.includes(b.slug)
        ).length;

        return (
          <section key={region} className="mt-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-lg font-semibold">{region}</h2>
              <span className="text-sm text-[var(--muted)]">
                {completedCount}/{regionBridges.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {regionBridges.map((bridge) => {
                const isCompleted = completedSlugs.includes(bridge.slug);
                return (
                  <BridgeCard
                    key={bridge.slug}
                    bridge={bridge}
                    completed={isCompleted}
                    walkDate={isCompleted ? walkDates[bridge.slug] : undefined}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
