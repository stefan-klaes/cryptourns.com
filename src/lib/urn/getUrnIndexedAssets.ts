import { AssetType } from "@/generated/prisma";
import { db } from "@/lib/clients/db";

/** Serializable rows for the urn detail vault assets UI. */
export type UrnIndexedAssetRow = {
  contractAddress: string;
  tokenId: string;
  type: AssetType;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
};

export type UrnIndexedAssetsBuckets = {
  coins: UrnIndexedAssetRow[];
  nfts: UrnIndexedAssetRow[];
};

/**
 * Loads indexed `Asset` rows for an urn from the database (post-indexer sync).
 */
export async function getUrnIndexedAssets(
  urnId: number,
): Promise<UrnIndexedAssetsBuckets> {
  const rows = await db.asset.findMany({
    where: { urnId },
    orderBy: [{ contractAddress: "asc" }, { tokenId: "asc" }],
    select: {
      contractAddress: true,
      tokenId: true,
      type: true,
      quantity: true,
      name: true,
      imageUrl: true,
      collectionName: true,
    },
  });

  const coins: UrnIndexedAssetRow[] = [];
  const nfts: UrnIndexedAssetRow[] = [];
  for (const r of rows) {
    const row: UrnIndexedAssetRow = {
      contractAddress: r.contractAddress,
      tokenId: r.tokenId,
      type: r.type,
      quantity: r.quantity,
      name: r.name,
      imageUrl: r.imageUrl,
      collectionName: r.collectionName,
    };
    if (r.type === AssetType.ERC20) coins.push(row);
    else nfts.push(row);
  }

  return { coins, nfts };
}
