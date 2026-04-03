import { HomePageClient } from "@/components/home/HomePageClient";
import { getHomeCollectionsTeaser } from "@/lib/collections/getHomeCollectionsTeaser";
import { getCryptournFeed } from "@/lib/feed/getCryptournFeed";
import { getHomeStats } from "@/lib/home/getHomeStats";

export const dynamic = "force-dynamic";

const FEED_HOME_PREVIEW_LIMIT = 7;
const COLLECTIONS_TEASER_COUNT = 10;

export default async function Home() {
  const [homeStats, feedPreview, collectionsTeaser] = await Promise.all([
    getHomeStats(),
    getCryptournFeed({ limit: FEED_HOME_PREVIEW_LIMIT }),
    getHomeCollectionsTeaser(COLLECTIONS_TEASER_COUNT),
  ]);

  return (
    <HomePageClient
      homeStats={homeStats}
      feedPreview={feedPreview}
      collectionsTeaser={collectionsTeaser}
    />
  );
}
