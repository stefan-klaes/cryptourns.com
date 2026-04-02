import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { type UrnsListSort, urnsListHref } from "@/lib/urn/findManyUrns";
import type { Route } from "next";
import Link from "next/link";

const SORT_TABS: { value: UrnsListSort; label: string }[] = [
  { value: "assets", label: "Most assets" },
  { value: "candles", label: "Most candles" },
  { value: "latest", label: "Latest" },
];

type UrnsListSortBarProps = {
  sort: UrnsListSort;
  page: number;
  totalCount: number;
  pageSize: number;
};

export function UrnsListSortBar({
  sort,
  page,
  totalCount,
  pageSize,
}: UrnsListSortBarProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm tabular-nums text-muted-foreground">
        {totalCount === 0 ? (
          "No urns to show"
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </>
        )}
      </p>
      <nav aria-label="Sort urns">
        <ButtonGroup className="max-w-full overflow-x-auto">
          {SORT_TABS.map(({ value, label }) => {
            const active = sort === value;
            return (
              <Button
                key={value}
                nativeButton={false}
                render={<Link href={urnsListHref(value, 1) as Route} />}
                variant={active ? "default" : "outline"}
                size="sm"
              >
                {label}
              </Button>
            );
          })}
        </ButtonGroup>
      </nav>
    </div>
  );
}

type UrnsListPaginationProps = {
  sort: UrnsListSort;
  page: number;
  totalPages: number;
};

export function UrnsListPagination({
  sort,
  page,
  totalPages,
}: UrnsListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
      aria-label="Pagination"
    >
      <Button
        nativeButton={false}
        render={
          <Link href={urnsListHref(sort, Math.max(1, page - 1)) as Route} />
        }
        variant="outline"
        size="sm"
        disabled={page <= 1}
      >
        Previous
      </Button>
      <span className="px-2 text-sm tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        nativeButton={false}
        render={
          <Link
            href={urnsListHref(sort, Math.min(totalPages, page + 1)) as Route}
          />
        }
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </nav>
  );
}
