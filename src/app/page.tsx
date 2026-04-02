import { HomePageClient } from "@/components/home/HomePageClient";
import { getHomeStats } from "@/lib/home/getHomeStats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const homeStats = await getHomeStats();
  return <HomePageClient homeStats={homeStats} />;
}
