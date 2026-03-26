import { getAllCities, getBridgesForCity, getBridgesByRegion } from "@/lib/bridges";
import { getAllCompletedSlugs, getWalkBySlug } from "@/lib/walks";
import HomepageClient from "@/components/HomepageClient";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: citySlug = "nyc" } = await searchParams;
  const cities = await getAllCities();
  const bridges = await getBridgesForCity(citySlug);
  const regions = getBridgesByRegion(bridges);
  const completedSlugs = await getAllCompletedSlugs(citySlug);

  const walkDates: Record<string, string> = {};
  for (const slug of completedSlugs) {
    const walk = await getWalkBySlug(slug, citySlug);
    if (walk) walkDates[slug] = walk.date;
  }

  const parseMiles = (d: string) => parseFloat(d) || 0;
  const totalMiles = bridges.reduce((sum, b) => sum + parseMiles(b.distance), 0);
  const completedMiles = bridges
    .filter((b) => completedSlugs.includes(b.slug))
    .reduce((sum, b) => sum + parseMiles(b.distance), 0);

  return (
    <HomepageClient
      cities={cities}
      currentCity={citySlug}
      regions={regions}
      completedSlugs={completedSlugs}
      walkDates={walkDates}
      completedMiles={completedMiles}
      totalMiles={totalMiles}
      totalBridges={bridges.length}
    />
  );
}
