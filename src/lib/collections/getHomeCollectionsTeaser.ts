import { db } from "@/lib/clients/db";
import type {
  HomeCollectionTeaserRow,
  HomeCollectionsAggregates,
} from "@/lib/collections/homeCollectionsTeaserTypes";

export type {
  HomeCollectionTeaserRow,
  HomeCollectionsAggregates,
} from "@/lib/collections/homeCollectionsTeaserTypes";

type RawTeaserRow = {
  contractAddress: string;
  collectionName: string | null;
  name: string | null;
  imageUrl: string | null;
  totalIndexedQuantity: bigint | number | null;
  inUrnsCount: bigint | number | null;
};

type RawAggRow = {
  totalPieces: bigint | number | null;
  urnsWithAssets: bigint | number | null;
  contractCount: bigint | number | null;
};

/**
 * Top contracts by distinct urn count plus global aggregates for the homepage.
 * Does not load the full vault catalog.
 */
export async function getHomeCollectionsTeaser(take = 10): Promise<{
  rows: HomeCollectionTeaserRow[];
  aggregates: HomeCollectionsAggregates;
}> {
  const [aggRows, topRows] = await Promise.all([
    db.$queryRaw<RawAggRow[]>`
      SELECT
        COALESCE(SUM(quantity), 0)::bigint AS "totalPieces",
        COUNT(DISTINCT "urnId")::bigint AS "urnsWithAssets",
        COUNT(DISTINCT "contractAddress")::bigint AS "contractCount"
      FROM "Asset"
    `,
    db.$queryRaw<RawTeaserRow[]>`
      SELECT
        "contractAddress",
        SUM(quantity)::bigint AS "totalIndexedQuantity",
        COUNT(DISTINCT "urnId")::bigint AS "inUrnsCount",
        MAX("collectionName") FILTER (WHERE "collectionName" IS NOT NULL) AS "collectionName",
        MAX(name) FILTER (WHERE name IS NOT NULL) AS name,
        MAX("imageUrl") FILTER (WHERE "imageUrl" IS NOT NULL) AS "imageUrl"
      FROM "Asset"
      GROUP BY "contractAddress"
      ORDER BY COUNT(DISTINCT "urnId") DESC, SUM(quantity) DESC, "contractAddress" ASC
      LIMIT ${take}
    `,
  ]);

  const a = aggRows[0];
  const aggregates: HomeCollectionsAggregates = {
    totalPieces: Number(a?.totalPieces ?? 0),
    urnsWithAssets: Number(a?.urnsWithAssets ?? 0),
    contractCount: Number(a?.contractCount ?? 0),
  };

  const rows: HomeCollectionTeaserRow[] = topRows.map((r) => ({
    contractAddress: r.contractAddress,
    collectionName: r.collectionName,
    name: r.name,
    imageUrl: r.imageUrl,
    totalIndexedQuantity: Number(r.totalIndexedQuantity ?? 0),
    inUrnsCount: Number(r.inUrnsCount ?? 0),
  }));

  return { rows, aggregates };
}
