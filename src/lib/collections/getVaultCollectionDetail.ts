import { db } from "@/lib/clients/db";
import { AssetType } from "@/generated/prisma";

export type VaultCollectionDisplayMeta = {
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
};

export type VaultCollectionNftTransferRow = {
  urnId: number;
  cracked: boolean;
  tokenId: string;
  type: AssetType;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
  sentToUrn: Date | null;
};

export async function getVaultCollectionAssetTypes(
  contractAddress: string,
): Promise<AssetType[]> {
  const addr = contractAddress.toLowerCase();
  const rows = await db.asset.findMany({
    where: { contractAddress: addr },
    distinct: ["type"],
    select: { type: true },
    orderBy: { type: "asc" },
  });
  return rows.map((r) => r.type);
}

export async function getVaultCollectionMeta(
  contractAddress: string,
): Promise<VaultCollectionDisplayMeta | null> {
  return db.asset.findFirst({
    where: { contractAddress: contractAddress.toLowerCase() },
    orderBy: { id: "desc" },
    select: {
      collectionName: true,
      name: true,
      imageUrl: true,
    },
  });
}

export async function getVaultCollectionStats(contractAddress: string): Promise<{
  inUrnsCount: number;
  totalIndexedQuantity: number;
}> {
  const addr = contractAddress.toLowerCase();
  const rows = await db.asset.findMany({
    where: { contractAddress: addr },
    select: { quantity: true, urnId: true },
  });
  if (rows.length === 0) {
    return { inUrnsCount: 0, totalIndexedQuantity: 0 };
  }
  const urnIds = new Set(rows.map((r) => r.urnId));
  const totalIndexedQuantity = rows.reduce((acc, r) => acc + r.quantity, 0);
  return { inUrnsCount: urnIds.size, totalIndexedQuantity };
}

/**
 * NFT rows for this contract across vaults, newest `sentToUrn` first (nulls last).
 */
export async function getVaultCollectionNftTransfers(
  contractAddress: string,
): Promise<VaultCollectionNftTransferRow[]> {
  const addr = contractAddress.toLowerCase();
  const rows = await db.asset.findMany({
    where: {
      contractAddress: addr,
      type: { in: [AssetType.ERC721, AssetType.ERC1155] },
    },
    select: {
      tokenId: true,
      type: true,
      quantity: true,
      name: true,
      imageUrl: true,
      sentToUrn: true,
      urn: { select: { id: true, cracked: true } },
    },
  });

  const mapped: VaultCollectionNftTransferRow[] = rows.map((r) => ({
    urnId: r.urn.id,
    cracked: r.urn.cracked,
    tokenId: r.tokenId,
    type: r.type,
    quantity: r.quantity,
    name: r.name,
    imageUrl: r.imageUrl,
    sentToUrn: r.sentToUrn,
  }));

  mapped.sort((a, b) => {
    if (a.sentToUrn == null && b.sentToUrn == null) return 0;
    if (a.sentToUrn == null) return 1;
    if (b.sentToUrn == null) return -1;
    const d = b.sentToUrn.getTime() - a.sentToUrn.getTime();
    if (d !== 0) return d;
    if (a.urnId !== b.urnId) return a.urnId - b.urnId;
    return a.tokenId.localeCompare(b.tokenId);
  });

  return mapped;
}
