import type { AssetType } from "@/generated/prisma";

/** Normalized NFT row from Alchemy `getNFTs` `ownedNfts` entries. */
export type Asset = {
  contractAddress: string;
  tokenId: string;
  type: AssetType;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
};
