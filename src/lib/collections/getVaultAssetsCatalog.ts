import { db } from "@/lib/clients/db";
import type { AssetType } from "@/generated/prisma";

/** One row per contract. */
export type VaultCollectionCatalogRow = {
  contractAddress: string;
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
  /** Sum of `quantity` across all indexed rows for this contract (total “items” / units). */
  totalIndexedQuantity: number;
  /** Distinct urns with at least one indexed row for this contract. */
  inUrnsCount: number;
  types: AssetType[];
};

type RawCatalogRow = {
  contractAddress: string;
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
  totalIndexedQuantity: bigint | number | null;
  inUrnsCount: bigint | number | null;
  types: string[] | null;
};

const ASSET_TYPES = new Set<string>(["ERC721", "ERC1155", "ERC20"]);

function asAssetTypes(values: string[] | null): AssetType[] {
  if (!values?.length) return [];
  const out: AssetType[] = [];
  for (const v of values) {
    if (!ASSET_TYPES.has(v)) {
      throw new Error(`Unexpected Asset.type from catalog query: ${v}`);
    }
    out.push(v as AssetType);
  }
  return [...new Set(out)].sort();
}

/**
 * All distinct contracts in the asset index, with distinct urn counts.
 */
export async function getVaultAssetsCatalog(): Promise<
  VaultCollectionCatalogRow[]
> {
  const rows = await db.$queryRaw<RawCatalogRow[]>`
    SELECT
      "contractAddress",
      SUM(quantity)::bigint AS "totalIndexedQuantity",
      COUNT(DISTINCT "urnId")::bigint AS "inUrnsCount",
      MAX("collectionName") FILTER (WHERE "collectionName" IS NOT NULL) AS "collectionName",
      MAX(name) FILTER (WHERE name IS NOT NULL) AS name,
      MAX("imageUrl") FILTER (WHERE "imageUrl" IS NOT NULL) AS "imageUrl",
      ARRAY_AGG(DISTINCT type::text) AS types
    FROM "Asset"
    GROUP BY "contractAddress"
    ORDER BY COUNT(*) DESC, "totalIndexedQuantity" DESC, "contractAddress" ASC
  `;

  return rows.map((r) => ({
    contractAddress: r.contractAddress,
    collectionName: r.collectionName,
    name: r.name,
    imageUrl: r.imageUrl,
    totalIndexedQuantity: Number(r.totalIndexedQuantity ?? 0),
    inUrnsCount: Number(r.inUrnsCount ?? 0),
    types: asAssetTypes(r.types),
  }));
}

/** Distinct urns that have at least one asset row (for hero stats). */
export async function countUrnsWithAnyAsset(): Promise<number> {
  const rows = await db.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(DISTINCT "urnId")::bigint AS c FROM "Asset"
  `;
  return Number(rows[0]?.c ?? 0);
}
