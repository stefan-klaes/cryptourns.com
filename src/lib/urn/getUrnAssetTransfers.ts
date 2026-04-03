import { db } from "@/lib/clients/db";
import type { AssetTransferDirection, AssetType } from "@/generated/prisma";

/** Client-safe rows for the urn transfers UI (ISO dates). */
export type UrnAssetTransferRow = {
  id: string;
  direction: AssetTransferDirection;
  assetType: AssetType;
  transferAtIso: string | null;
  fromAddress: string;
  toAddress: string;
  /** Counterparty for list display: sender for IN, recipient for OUT. */
  counterpartyAddress: string;
  quantityLabel: string;
  contractAddress: string;
  tokenId: string;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
  txHash: string;
};

export async function getUrnAssetTransfers(
  urnId: number,
): Promise<UrnAssetTransferRow[]> {
  const rows = await db.urnAssetTransfer.findMany({
    where: { urnId },
    orderBy: [
      { blockNumber: "desc" },
      { logIndex: "desc" },
      { id: "desc" },
    ],
  });

  return rows.map((r) => ({
    id: String(r.id),
    direction: r.direction,
    assetType: r.assetType,
    transferAtIso: r.occurredAt?.toISOString() ?? null,
    fromAddress: r.fromAddress,
    toAddress: r.toAddress,
    counterpartyAddress:
      r.direction === "IN" ? r.fromAddress : r.toAddress,
    quantityLabel: r.quantityDisplay ?? r.quantityRaw,
    contractAddress: r.contractAddress,
    tokenId: r.tokenId,
    name: r.name,
    imageUrl: r.imageUrl,
    collectionName: r.collectionName,
    txHash: r.txHash,
  }));
}
