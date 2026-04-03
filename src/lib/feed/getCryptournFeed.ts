import { db } from "@/lib/clients/db";
import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { urnListInclude } from "@/lib/urn/toUrnMetadata";

import {
  assetFeedItem,
  assetOccurredAt,
  candleFeedItem,
  mintFeedItem,
} from "./feedCopy";
import { formatFeedTimestamp } from "./formatFeedTimestamp";
import { resolveAssetFeedImageUrl } from "./resolveAssetFeedImageUrl";

const FEED_TAKE_MINTS = 40;
const FEED_TAKE_CANDLES = 40;
const FEED_TAKE_ASSETS = 40;
const FEED_MAX_ITEMS = 80;

export async function getCryptournFeed() {
  const { explorerBaseUrl } = getCryptournsChainConfig();

  const [mintRows, candleRows, assetIdRows] = await Promise.all([
    db.urn.findMany({
      orderBy: { mintedAt: "desc" },
      take: FEED_TAKE_MINTS,
      select: {
        id: true,
        mintedAt: true,
        mintTx: true,
        mintedBy: true,
      },
    }),
    db.candle.findMany({
      orderBy: { createdAt: "desc" },
      take: FEED_TAKE_CANDLES,
      include: {
        urn: { include: urnListInclude },
      },
    }),
    db.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Asset"
      ORDER BY COALESCE("sentToUrn", "createdAt") DESC
      LIMIT ${FEED_TAKE_ASSETS}
    `,
  ]);

  const assetIds = assetIdRows.map((r) => r.id);
  const assetRows =
    assetIds.length === 0
      ? []
      : await db.asset.findMany({
          where: { id: { in: assetIds } },
          include: { urn: { include: urnListInclude } },
        });
  const assetById = new Map(assetRows.map((a) => [a.id, a]));
  const orderedAssets = assetIds
    .map((id) => assetById.get(id))
    .filter((a): a is NonNullable<typeof a> => a != null);

  const mintItems = mintRows.map((row) =>
    mintFeedItem(
      row,
      explorerBaseUrl,
      formatFeedTimestamp(row.mintedAt.toISOString()),
    ),
  );
  const candleItems = candleRows.map((row) =>
    candleFeedItem(
      row,
      explorerBaseUrl,
      formatFeedTimestamp(row.createdAt.toISOString()),
    ),
  );
  const assetItems = await Promise.all(
    orderedAssets.map(async (row) => {
      const assetImageUrl = await resolveAssetFeedImageUrl(row);
      return assetFeedItem(
        row,
        explorerBaseUrl,
        formatFeedTimestamp(assetOccurredAt(row).toISOString()),
        assetImageUrl,
      );
    }),
  );

  return [...mintItems, ...candleItems, ...assetItems]
    .sort(
      (a, b) =>
        Date.parse(b.occurredAtIso) - Date.parse(a.occurredAtIso),
    )
    .slice(0, FEED_MAX_ITEMS);
}
