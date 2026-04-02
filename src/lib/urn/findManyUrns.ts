import { db } from "@/lib/clients/db";
import type { UrnMetadata } from "@/lib/urn/UrnMetadata";
import { toUrnMetadata, urnListInclude } from "@/lib/urn/toUrnMetadata";

export type FindManyUrnsOptions = {
  page?: number;
  limit?: number;
  /** Gallery ordering; default most assets, then candles, then newest id. */
  sortBy?: UrnsListSort;
};

const defaultPage = 1;
const defaultSortBy: UrnsListSort = "assets";

/** Default page size for the public urns gallery. */
export const URNS_LIST_PAGE_SIZE = 24;

export const URNS_LIST_SORTS = ["assets", "candles", "latest"] as const;
export type UrnsListSort = (typeof URNS_LIST_SORTS)[number];

function firstQueryString(
  v: string | string[] | undefined,
): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseUrnsListSearchParams(
  raw: Record<string, string | string[] | undefined>,
): { page: number; sort: UrnsListSort; limit: number } {
  const pageRaw = firstQueryString(raw.page);
  const sortRaw = firstQueryString(raw.sort);

  let page = pageRaw != null ? Number.parseInt(pageRaw, 10) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  const sort = URNS_LIST_SORTS.includes(sortRaw as UrnsListSort)
    ? (sortRaw as UrnsListSort)
    : "assets";

  return { page, sort, limit: URNS_LIST_PAGE_SIZE };
}

/** Build `/urns` href preserving defaults (omit redundant query keys). */
export function urnsListHref(sort: UrnsListSort, page: number): string {
  const params = new URLSearchParams();
  if (sort !== "assets") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const q = params.toString();
  return q ? `/urns?${q}` : "/urns";
}

export async function countUrns(): Promise<number> {
  return db.urn.count();
}

/** Primary sort from the UI; remaining keys are tiebreakers. */
function orderByForGallerySort(sort: UrnsListSort) {
  switch (sort) {
    case "candles":
      return [
        { candles: { _count: "desc" as const } },
        { assets: { _count: "desc" as const } },
        { id: "desc" as const },
      ];
    case "latest":
      return [
        { id: "desc" as const },
        { assets: { _count: "desc" as const } },
        { candles: { _count: "desc" as const } },
      ];
    default:
      return [
        { assets: { _count: "desc" as const } },
        { candles: { _count: "desc" as const } },
        { id: "desc" as const },
      ];
  }
}

/**
 * Lists urns as `UrnMetadata`. Default: page 1, no limit (all rows), gallery sort (most assets first).
 * Pagination applies only when `limit` is set (`skip` / `take`).
 */
export async function findManyUrns(
  options: FindManyUrnsOptions = {},
): Promise<UrnMetadata[]> {
  const page = options.page ?? defaultPage;
  const sortBy = options.sortBy ?? defaultSortBy;
  const limit = options.limit;

  const rows = await db.urn.findMany({
    orderBy: orderByForGallerySort(sortBy),
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
