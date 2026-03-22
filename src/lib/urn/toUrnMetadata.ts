import { AssetType } from "@/generated/prisma";
import type { UrnAttributes, UrnMetadata } from "@/lib/urn/UrnMetadata";

export const urnListInclude = {
  assets: {
    orderBy: [{ contractAddress: "asc" as const }, { tokenId: "asc" as const }],
  },
  _count: { select: { candles: true } },
};

export type UrnWithListInclude = {
  id: number;
  tba: string;
  cracked: boolean;
  assets: { type: AssetType; quantity: number }[];
  _count: { candles: number };
};

/** Maps a DB urn row (with list include) to ERC-721 `UrnMetadata`. */
export function toUrnMetadata(urn: UrnWithListInclude): UrnMetadata {
  const urnId = urn.id;

  let nfts = 0;
  let coins = 0;
  for (const a of urn.assets) {
    if (a.type === AssetType.ERC20) coins += a.quantity;
    else nfts += a.quantity;
  }

  const candleCount = urn._count.candles;
  const cracked = urn.cracked ? "Yes" : "No";
  const attributes: UrnAttributes = [
    { trait_type: "NFTs", value: nfts, display_type: "number" },
    { trait_type: "Coins", value: coins, display_type: "number" },
    { trait_type: "Candles", value: candleCount, display_type: "number" },
    { trait_type: "Urn address", value: urn.tba, display_type: "string" },
    { trait_type: "Cracked", value: cracked, display_type: "string" },
  ];

  return {
    tokenId: urnId,
    name: `Cryptourn #${urnId}`,
    description: `Cryptourn urn #${urnId}. Token-bound account holds ${nfts} NFT${nfts === 1 ? "" : "s"}, ${coins} coin${coins === 1 ? "" : "s"}, and ${candleCount} candle${candleCount === 1 ? "" : "s"} (indexed totals).`,
    image: `/api/urn/image/cryptourn-${urnId}.png`,
    attributes,
  };
}
