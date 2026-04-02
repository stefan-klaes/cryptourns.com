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
  /** When the NFT was acquired by the owner (TBA), from Alchemy `acquiredAt` with `orderBy=transferTime`. */
  sentToUrn: Date | null;
};
