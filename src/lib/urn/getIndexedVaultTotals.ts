import { db } from "@/lib/clients/db";

/** Sum of asset quantities and candle rows across all indexed urns. */
export async function getIndexedVaultTotals(): Promise<{
  assetUnits: number;
  candles: number;
}> {
  const [assetAgg, candles] = await Promise.all([
    db.asset.aggregate({ _sum: { quantity: true } }),
    db.candle.count(),
  ]);

  return {
    assetUnits: assetAgg._sum.quantity ?? 0,
    candles,
  };
}
