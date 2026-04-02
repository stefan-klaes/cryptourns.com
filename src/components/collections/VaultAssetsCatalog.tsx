import { collectionHref } from "@/lib/collections/collectionHref";
import { explorerHrefForCollection } from "@/lib/collections/explorerHrefForCollection";
import type { VaultCollectionCatalogRow } from "@/lib/collections/getVaultAssetsCatalog";
import type { AssetType } from "@/generated/prisma";
import { ExternalLink } from "lucide-react";
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

function displayTitle(row: VaultCollectionCatalogRow): string {
  return (
    row.collectionName?.trim() ||
    row.name?.trim() ||
    `Contract ${shortHex(row.contractAddress)}`
  );
}

function isErc20Only(types: AssetType[]): boolean {
  return types.length === 1 && types[0] === "ERC20";
}

function typesLabel(types: AssetType[]): string {
  return types
    .map((t) => {
      if (t === "ERC20") return "Coins";
      if (t === "ERC721") return "ERC-721";
      return "ERC-1155";
    })
    .join(" · ");
}

type VaultAssetsCatalogProps = {
  rows: VaultCollectionCatalogRow[];
  explorerBaseUrl: string;
};

export function VaultAssetsCatalog({
  rows,
  explorerBaseUrl,
}: VaultAssetsCatalogProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Open some urn pages so vault contents sync into the
          database.
        </p>
        <p className="mt-4">
          <Link
            href="/urns"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Browse urns
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className="border-t border-border">
      {rows.map((row, index) => {
        const rank = index + 1;
        const href = collectionHref(row.contractAddress);
        const explorerHref = explorerHrefForCollection(
          explorerBaseUrl,
          row.contractAddress,
        );
        const contract = safeChecksummed(row.contractAddress);
        const titleText = displayTitle(row);
        const showSubtitle =
          Boolean(row.collectionName?.trim()) &&
          Boolean(row.name?.trim()) &&
          titleText === row.collectionName?.trim();

        return (
          <li
            key={row.contractAddress}
            className="relative border-b border-border"
            aria-label={`Rank ${rank}: ${titleText}`}
          >
            <div className="py-8 pr-12 sm:pr-14">
              <Link
                href={href}
                className="group flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10"
              >
                <div className="flex min-w-0 flex-1 gap-5 sm:gap-8">
                  <div
                    className="flex shrink-0 flex-col items-center justify-start pt-1 sm:pt-2"
                    aria-hidden
                  >
                    <span className="text-3xl font-black tabular-nums leading-none text-muted-foreground/40 sm:text-4xl">
                      {rank}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-6">
                    <div>
                      <h2 className="text-4xl font-bold leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                        <span className="transition-colors group-hover:text-primary">
                          {titleText}
                        </span>
                      </h2>
                      {showSubtitle ? (
                        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                          {row.name?.trim()}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Pieces in urns
                        </p>
                        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                          {row.totalIndexedQuantity.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Urns holding
                        </p>
                        <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                          {row.inUrnsCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p
                        className="break-all font-mono text-xs text-muted-foreground"
                        title={contract}
                      >
                        {contract}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typesLabel(row.types)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mx-auto h-48 w-full max-w-sm shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:mx-0 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt={titleText}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 16rem"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                      {isErc20Only(row.types) ? "Coins" : "No art"}
                    </div>
                  )}
                </div>
              </Link>

              <a
                href={explorerHref}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-0 top-8 inline-flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
                aria-label="View on explorer"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
