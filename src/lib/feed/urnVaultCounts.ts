import { AssetType } from "@/generated/prisma";
import type { UrnWithListInclude } from "@/lib/urn/toUrnMetadata";

export function urnVaultCounts(urn: UrnWithListInclude) {
  let nftCount = 0;
  let coinCount = 0;
  for (const a of urn.assets) {
    if (a.type === AssetType.ERC20) coinCount += a.quantity;
    else nftCount += a.quantity;
  }
  return {
    nftCount,
    coinCount,
    candleCount: urn._count.candles,
    cracked: urn.cracked,
  };
}
