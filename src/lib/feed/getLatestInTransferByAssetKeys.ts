import { AssetTransferDirection } from "@/generated/prisma";
import { db } from "@/lib/clients/db";

export type AssetTransferLookupKey = {
  urnId: number;
  contractAddress: string;
  tokenId: string;
};

export type LatestInTransfer = {
  txHash: string;
  fromAddress: string;
};

export function feedItemAssetTransferKey(
  urnId: number,
  contractAddress: string,
  tokenId: string,
): string {
  return `${urnId}:${contractAddress.toLowerCase()}:${tokenId}`;
}

function rowKey(urnId: number, contractAddress: string, tokenId: string): string {
  return feedItemAssetTransferKey(urnId, contractAddress, tokenId);
}

/**
 * Latest IN transfer per (urn, contract, token) for linking deposit tx + sender in the feed.
 */
export async function getLatestInTransferByAssetKeys(
  keys: AssetTransferLookupKey[],
): Promise<Map<string, LatestInTransfer>> {
  const out = new Map<string, LatestInTransfer>();
  if (keys.length === 0) return out;

  const seen = new Set<string>();
  const unique: AssetTransferLookupKey[] = [];
  for (const k of keys) {
    const rk = rowKey(k.urnId, k.contractAddress, k.tokenId);
    if (seen.has(rk)) continue;
    seen.add(rk);
    unique.push(k);
  }

  const rows = await db.urnAssetTransfer.findMany({
    where: {
      direction: AssetTransferDirection.IN,
      OR: unique.map((k) => ({
        urnId: k.urnId,
        contractAddress: k.contractAddress,
        tokenId: k.tokenId,
      })),
    },
    select: {
      urnId: true,
      contractAddress: true,
      tokenId: true,
      txHash: true,
      fromAddress: true,
      blockNumber: true,
    },
  });

  const bestBn = new Map<string, number>();
  for (const row of rows) {
    const k = rowKey(row.urnId, row.contractAddress, row.tokenId);
    const prevBn = bestBn.get(k);
    if (prevBn != null && row.blockNumber <= prevBn) continue;
    bestBn.set(k, row.blockNumber);
    out.set(k, { txHash: row.txHash, fromAddress: row.fromAddress });
  }

  return out;
}
