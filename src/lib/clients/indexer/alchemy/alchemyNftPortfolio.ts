import type { Address } from "viem";

/** Display fields for wallet portfolio (Alchemy `getNFTs` with `withMetadata`). */
export type AlchemyNftPortfolioRow = {
  contractAddress: Address;
  tokenId: string;
  standard: "ERC721" | "ERC1155";
  quantity: number;
  name: string | null;
  image: string | null;
  collectionName: string | null;
  sentToUrn: Date | null;
};

function mergeSentToUrn(a: Date | null, b: Date | null): Date | null {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a ?? b;
}

function sentToUrnEquals(a: Date | null, b: Date | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
}

export function mergePortfolioNftRows(
  primary: AlchemyNftPortfolioRow[],
  secondary: AlchemyNftPortfolioRow[],
): AlchemyNftPortfolioRow[] {
  const key = (r: AlchemyNftPortfolioRow) =>
    `${r.contractAddress.toLowerCase()}-${r.tokenId}`;
  const map = new Map<string, AlchemyNftPortfolioRow>();
  for (const r of primary) {
    map.set(key(r), r);
  }
  for (const r of secondary) {
    const k = key(r);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, r);
      continue;
    }
    const mergedSent = mergeSentToUrn(existing.sentToUrn, r.sentToUrn);
    const needsDisplay =
      (!existing.name && r.name) ||
      (!existing.image && r.image) ||
      (!existing.collectionName && r.collectionName);
    if (needsDisplay || !sentToUrnEquals(existing.sentToUrn, mergedSent)) {
      map.set(k, {
        ...existing,
        name: existing.name || r.name || null,
        image: existing.image || r.image || null,
        collectionName: existing.collectionName || r.collectionName || null,
        sentToUrn: mergedSent,
      });
    }
  }
  return [...map.values()];
}
