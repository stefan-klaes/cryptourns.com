import { db } from "@/lib/clients/db";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import { toUrnMetadata, urnListInclude } from "@/lib/urn/toUrnMetadata";

export type FindManyUrnsSortBy = "urnId" | "urnIdDesc";

export type FindManyUrnsOptions = {
  page?: number;
  limit?: number;
  sortBy?: FindManyUrnsSortBy;
};

const defaultPage = 1;
const defaultSortBy: FindManyUrnsSortBy = "urnId";

/**
 * Lists urns as `UrnMetadata`. Default: page 1, no limit (all rows), sorted by urn id ascending.
 * Pagination applies only when `limit` is set (`skip` / `take`).
 */
export async function findManyUrns(
  options: FindManyUrnsOptions = {},
): Promise<UrnMetadata[]> {
  const page = options.page ?? defaultPage;
  const sortBy = options.sortBy ?? defaultSortBy;
  const limit = options.limit;

  const orderBy =
    sortBy === "urnIdDesc" ? ({ id: "desc" } as const) : ({ id: "asc" } as const);

  const rows = await db.urn.findMany({
    orderBy,
    include: urnListInclude,
    ...(limit != null && limit > 0
      ? {
          skip: Math.max(0, page - 1) * limit,
          take: limit,
        }
      : {}),
  });

  return rows.map(toUrnMetadata);
}
