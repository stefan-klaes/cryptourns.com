import { collectionHref } from "@/lib/collections/collectionHref";
import type {
  HomeCollectionTeaserRow,
  HomeCollectionsAggregates,
} from "@/lib/collections/homeCollectionsTeaserTypes";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAddress, isAddress } from "viem";

function shortHex(value: string): string {
  if (!value.startsWith("0x") || value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function safeChecksummed(addr: string): string {
  if (!isAddress(addr)) return addr;
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}

function displayTitle(row: HomeCollectionTeaserRow): string {
  return (
    row.collectionName?.trim() ||
    row.name?.trim() ||
    `Contract ${shortHex(row.contractAddress)}`
  );
}

function isHttpImageSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export type HomeCollectionsTeaserProps = {
  rows: HomeCollectionTeaserRow[];
  aggregates: HomeCollectionsAggregates;
};

export function HomeCollectionsTeaser({
  rows,
  aggregates,
}: HomeCollectionsTeaserProps) {
  const hasVaults = aggregates.totalPieces > 0;

  return (
    <section
      className="border-t border-border/70 py-14 sm:py-16"
      aria-labelledby="home-collections-teaser-heading"
    >
      <div className="mb-8 max-w-2xl space-y-2">
        <h2
          id="home-collections-teaser-heading"
          className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase"
        >
          What&apos;s in the vaults
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          What got buried—and which urns are holding it. Top contracts by urn
          count.
        </p>
      </div>

      {hasVaults ? (
        <div className="mb-10 space-y-4 rounded-2xl border border-border bg-muted/30 px-5 py-8 sm:px-8">
          <p className="text-4xl font-bold leading-none tracking-tighter tabular-nums sm:text-5xl">
            {aggregates.totalPieces.toLocaleString()}
          </p>
          <p className="max-w-xl text-base font-medium leading-snug text-muted-foreground sm:text-lg">
            Total pieces living in urns—JPEGs, editions, coins, whatever the
            vaults are holding.
          </p>
          <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm font-medium text-foreground sm:text-base">
            <span>
              <span className="tabular-nums text-xl font-bold sm:text-2xl">
                {aggregates.urnsWithAssets.toLocaleString()}
              </span>{" "}
              <span className="text-muted-foreground">urns</span>
            </span>
            <span>
              <span className="tabular-nums text-xl font-bold sm:text-2xl">
                {aggregates.contractCount.toLocaleString()}
              </span>{" "}
              <span className="text-muted-foreground">contracts</span>
            </span>
          </p>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing indexed in vaults yet. Mint an urn and send assets to its
            token-bound address to see collections here.
          </p>
          <p className="mt-4">
            <Link
              href="/mint"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Mint an urn
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] sm:gap-4">
            {rows.map((row) => {
              const href = collectionHref(row.contractAddress);
              const title = displayTitle(row);
              const contract = safeChecksummed(row.contractAddress);
              const img = row.imageUrl?.trim() ?? null;

              return (
                <Link
                  key={row.contractAddress}
                  href={href as Route}
                  className={cn(
                    "group flex w-[9.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/90 bg-card/50 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow,background-color] duration-200",
                    "hover:border-primary/40 hover:bg-card/80 hover:shadow-md dark:ring-white/10",
                  )}
                >
                  <div className="relative aspect-square w-full bg-gradient-to-b from-muted/40 to-muted/70">
                    {img && isHttpImageSrc(img) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- NFT media from IPFS gateways / CDNs
                      <img
                        src={img}
                        alt={title}
                        className="absolute inset-0 size-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    ) : img ? (
                      <Image
                        src={img}
                        alt={title}
                        fill
                        className="object-cover object-center transition-transform duration-200 group-hover:scale-[1.03]"
                        sizes="152px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center px-2 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                        No art
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-[4.25rem] flex-col justify-center gap-1 border-t border-border/60 p-3">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary">
                      {title}
                    </p>
                    <p className="text-[0.65rem] tabular-nums text-muted-foreground">
                      {row.inUrnsCount.toLocaleString()} urn
                      {row.inUrnsCount === 1 ? "" : "s"}
                    </p>
                    <p
                      className="truncate font-mono text-[0.65rem] text-muted-foreground/80"
                      title={contract}
                    >
                      {shortHex(contract)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-6">
            <Link
              href="/collections"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              View all collections
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
