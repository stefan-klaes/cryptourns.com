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
import {
  feedItemAssetTransferKey,
  getLatestInTransferByAssetKeys,
} from "./getLatestInTransferByAssetKeys";
import { resolveAssetFeedImageUrl } from "./resolveAssetFeedImageUrl";

const FEED_TAKE_FULL = 40;
const FEED_MAX_ITEMS_FULL = 80;

export type GetCryptournFeedOptions = {
  /** Max items after merge (newest first). Capped at 80. Default 80. */
  limit?: number;
};

function feedSourceTake(limit: number): number {
  if (limit >= FEED_MAX_ITEMS_FULL) return FEED_TAKE_FULL;
  return Math.min(FEED_TAKE_FULL, Math.max(15, Math.ceil(limit * 3)));
}

export async function getCryptournFeed(options?: GetCryptournFeedOptions) {
  const maxItems = Math.min(
    options?.limit ?? FEED_MAX_ITEMS_FULL,
    FEED_MAX_ITEMS_FULL,
  );
  const take = feedSourceTake(maxItems);
  const { explorerBaseUrl } = getCryptournsChainConfig();

  const [mintRows, candleRows, assetIdRows] = await Promise.all([
    db.urn.findMany({
      orderBy: { mintedAt: "desc" },
      take,
      select: {
        id: true,
        mintedAt: true,
        mintTx: true,
        mintedBy: true,
      },
    }),
    db.candle.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        urn: { include: urnListInclude },
      },
    }),
    db.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Asset"
      ORDER BY COALESCE("sentToUrn", "createdAt") DESC
      LIMIT ${take}
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

  const transferByKey = await getLatestInTransferByAssetKeys(
    orderedAssets.map((a) => ({
      urnId: a.urnId,
      contractAddress: a.contractAddress,
      tokenId: a.tokenId,
    })),
  );

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
      const tkey = feedItemAssetTransferKey(
        row.urnId,
        row.contractAddress,
        row.tokenId,
      );
      const latestIn = transferByKey.get(tkey) ?? null;
      return assetFeedItem(
        row,
        explorerBaseUrl,
        formatFeedTimestamp(assetOccurredAt(row).toISOString()),
        assetImageUrl,
        latestIn,
      );
    }),
  );

  return [...mintItems, ...candleItems, ...assetItems]
    .sort(
      (a, b) =>
        Date.parse(b.occurredAtIso) - Date.parse(a.occurredAtIso),
    )
    .slice(0, maxItems);
}
