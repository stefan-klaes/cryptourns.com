import { AssetType } from "@/generated/prisma";
import { db } from "@/lib/clients/db";
import { getCryptournsSupply } from "@/lib/clients/indexer/services/getCryptournsSupply";

export type HomeStatsSnapshot = {
  /** On-chain total supply; `null` when the indexer call fails. */
  totalMinted: number | null;
  /** Sum of indexed ERC-20 quantities held in urn token-bound accounts. */
  coinsInUrns: number;
  /** Sum of indexed ERC-721 / ERC-1155 units in urns. */
  nftsInUrns: number;
  /** Indexed candle records (lighted candles on-chain). */
  lightedCandles: number;
};

export async function getHomeStats(): Promise<HomeStatsSnapshot> {
  const [supplyResult, coinAgg, nftAgg, lightedCandles] = await Promise.all([
    getCryptournsSupply()
      .then((n) => ({ ok: true as const, n }))
      .catch(() => ({ ok: false as const })),
    db.asset.aggregate({
      where: { type: AssetType.ERC20 },
      _sum: { quantity: true },
    }),
    db.asset.aggregate({
      where: { type: { in: [AssetType.ERC721, AssetType.ERC1155] } },
      _sum: { quantity: true },
    }),
    db.candle.count(),
  ]);

  return {
    totalMinted: supplyResult.ok ? supplyResult.n : null,
    coinsInUrns: coinAgg._sum.quantity ?? 0,
    nftsInUrns: nftAgg._sum.quantity ?? 0,
    lightedCandles,
  };
}
