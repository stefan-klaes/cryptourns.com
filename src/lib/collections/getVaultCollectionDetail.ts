import { db } from "@/lib/clients/db";
import { AssetType } from "@/generated/prisma";

export type VaultCollectionDisplayMeta = {
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
};

/** One ERC-721 token id in vaults (deduped across urns — at most one holder per token in practice). */
export type VaultCollectionErc721Token = {
  tokenId: string;
  urnId: number;
  name: string | null;
  imageUrl: string | null;
};

export type VaultCollectionFungibleUrnLine = {
  type: AssetType;
  tokenId: string;
  quantity: number;
  name: string | null;
};

/** Urns that hold ERC-1155 or ERC-20 from this contract. */
export type VaultCollectionFungibleUrnRow = {
  urnId: number;
  cracked: boolean;
  lines: VaultCollectionFungibleUrnLine[];
};

function tokenIdSortKey(tokenId: string): bigint | null {
  try {
    return BigInt(tokenId);
  } catch {
    return null;
  }
}

function compareTokenIds(a: string, b: string): number {
  const ba = tokenIdSortKey(a);
  const bb = tokenIdSortKey(b);
  if (ba !== null && bb !== null) {
    if (ba < bb) return -1;
    if (ba > bb) return 1;
    return 0;
  }
  return a.localeCompare(b);
}

function metadataScore(row: {
  imageUrl: string | null;
  name: string | null;
  sentToUrn: Date | null;
}): number {
  let s = 0;
  if (row.imageUrl?.trim()) s += 4;
  if (row.name?.trim()) s += 2;
  if (row.sentToUrn) s += 1;
  return s;
}

/**
 * Distinct ERC-721 `tokenId`s for this contract with the best available metadata per id.
 */
export async function getVaultCollectionErc721Tokens(
  contractAddress: string,
): Promise<VaultCollectionErc721Token[]> {
  const addr = contractAddress.toLowerCase();
  const rows = await db.asset.findMany({
    where: { contractAddress: addr, type: AssetType.ERC721 },
    select: {
      urnId: true,
      tokenId: true,
      name: true,
      imageUrl: true,
      sentToUrn: true,
    },
  });

  const best = new Map<
    string,
    {
      tokenId: string;
      urnId: number;
      name: string | null;
      imageUrl: string | null;
      score: number;
    }
  >();

  for (const r of rows) {
    const score = metadataScore(r);
    const cur = best.get(r.tokenId);
    if (!cur || score > cur.score) {
      best.set(r.tokenId, {
        tokenId: r.tokenId,
        urnId: r.urnId,
        name: r.name,
        imageUrl: r.imageUrl,
        score,
      });
    }
  }

  return Array.from(best.values())
    .map(({ score: _s, ...rest }) => rest)
    .sort((a, b) => compareTokenIds(a.tokenId, b.tokenId));
}

/**
 * Urns holding ERC-1155 or ERC-20 for this contract, newest vault activity first.
 */
export async function getVaultCollectionFungibleUrns(
  contractAddress: string,
): Promise<VaultCollectionFungibleUrnRow[]> {
  const addr = contractAddress.toLowerCase();
  const rows = await db.asset.findMany({
    where: {
      contractAddress: addr,
      type: { in: [AssetType.ERC1155, AssetType.ERC20] },
    },
    select: {
      tokenId: true,
      type: true,
      quantity: true,
      name: true,
      sentToUrn: true,
      urn: { select: { id: true, cracked: true } },
    },
  });

  type Bucket = {
    urnId: number;
    cracked: boolean;
    linesByKey: Map<string, VaultCollectionFungibleUrnLine>;
    latestSent: Date | null;
  };

  const byUrn = new Map<number, Bucket>();

  for (const r of rows) {
    const urnId = r.urn.id;
    let bucket = byUrn.get(urnId);
    if (!bucket) {
      bucket = {
        urnId,
        cracked: r.urn.cracked,
        linesByKey: new Map(),
        latestSent: null,
      };
      byUrn.set(urnId, bucket);
    }
    if (r.sentToUrn && (!bucket.latestSent || r.sentToUrn > bucket.latestSent)) {
      bucket.latestSent = r.sentToUrn;
    }
    const key = `${r.type}:${r.tokenId}`;
    bucket.linesByKey.set(key, {
      type: r.type,
      tokenId: r.tokenId,
      quantity: r.quantity,
      name: r.name,
    });
  }

  const out: VaultCollectionFungibleUrnRow[] = Array.from(byUrn.values()).map(
    (b) => ({
      urnId: b.urnId,
      cracked: b.cracked,
      lines: Array.from(b.linesByKey.values()).sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === AssetType.ERC1155) return -1;
          if (b.type === AssetType.ERC1155) return 1;
        }
        return compareTokenIds(a.tokenId, b.tokenId);
      }),
    }),
  );

  out.sort((a, b) => {
    const ua = byUrn.get(a.urnId)?.latestSent;
    const ub = byUrn.get(b.urnId)?.latestSent;
    if (ua == null && ub == null) return a.urnId - b.urnId;
    if (ua == null) return 1;
    if (ub == null) return -1;
    const d = ub.getTime() - ua.getTime();
    if (d !== 0) return d;
    return a.urnId - b.urnId;
  });

  return out;
}

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
