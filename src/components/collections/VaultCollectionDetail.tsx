import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { Button } from "@/components/ui/button";
import { explorerHrefForCollection } from "@/lib/collections/explorerHrefForCollection";
import type {
  VaultCollectionDisplayMeta,
  VaultCollectionNftTransferRow,
} from "@/lib/collections/getVaultCollectionDetail";
import type { AssetType } from "@/generated/prisma";
import { formatSentToUrnRelative } from "@/lib/time/formatSentToUrn";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { getAddress, isAddress } from "viem";

function safeChecksummed(addr: string): string {
  if (!isAddress(addr)) return addr;
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}

function explorerHrefForNft(
  explorerBaseUrl: string,
  contractAddress: string,
  row: VaultCollectionNftTransferRow,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(contractAddress);
  if (row.type === "ERC721") {
    return `${base}/nft/${contract}/${row.tokenId}`;
  }
  return `${base}/token/${contract}?a=${encodeURIComponent(row.tokenId)}`;
}

type VaultCollectionDetailProps = {
  contractAddress: string;
  meta: VaultCollectionDisplayMeta | null;
  types: AssetType[];
  transfers: VaultCollectionNftTransferRow[];
  totalIndexedQuantity: number;
  inUrnsCount: number;
  explorerBaseUrl: string;
};

function StatBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export function VaultCollectionDetail({
  contractAddress,
  meta,
  types,
  transfers,
  totalIndexedQuantity,
  inUrnsCount,
  explorerBaseUrl,
}: VaultCollectionDetailProps) {
  const collectionTitle =
    meta?.collectionName?.trim() ||
    meta?.name?.trim() ||
    "Unnamed collection";
  const explorerHref = explorerHrefForCollection(
    explorerBaseUrl,
    contractAddress,
  );
  const contract = safeChecksummed(contractAddress);
  const typesLine = types
    .map((t) => {
      if (t === "ERC20") return "Coins";
      if (t === "ERC721") return "ERC-721";
      return "ERC-1155";
    })
    .join(" · ");

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative aspect-[21/9] max-h-56 w-full bg-muted sm:aspect-[3/1] sm:max-h-64">
          {meta?.imageUrl ? (
            <Image
              src={meta.imageUrl}
              alt={collectionTitle}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 72rem"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No collection image
            </div>
          )}
        </div>
        <div className="space-y-5 border-t border-border p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {collectionTitle}
              </h1>
              {meta?.name?.trim() &&
              meta?.collectionName?.trim() &&
              collectionTitle === meta.collectionName.trim() ? (
                <p className="text-sm text-muted-foreground">
                  {meta.name.trim()}
                </p>
              ) : null}
            </div>
            <a
              href={explorerHref}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Etherscan"
              aria-label="View on Etherscan"
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
                "bg-[#21325B] text-white shadow-sm transition-opacity hover:opacity-90",
                "ring-1 ring-white/10",
              )}
            >
              <EtherscanLogo className="size-4" aria-hidden />
            </a>
          </div>

          <p className="break-all font-mono text-xs text-muted-foreground">
            {contract}
          </p>
          <p className="text-xs text-muted-foreground">{typesLine}</p>

          <div className="rounded-2xl border border-border bg-muted/40 px-5 py-8 sm:px-8 sm:py-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8">
              <StatBlock label="Pieces in urns" value={totalIndexedQuantity} />
              <StatBlock label="Urns holding" value={inUrnsCount} />
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Transfers into urns
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            NFTs from this collection in vaults, newest arrivals first. Each row
            shows when the piece was sent into the vault.
          </p>
        </div>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No NFT rows indexed for this contract yet (only coin balances, or
            metadata not synced).
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {transfers.map((t) => {
              const urnName = `Cryptourn #${t.urnId}`;
              const title =
                t.name?.trim() || `Token #${t.tokenId}`;
              const sentMeta = formatSentToUrnRelative(t.sentToUrn);
              const nftHref = explorerHrefForNft(
                explorerBaseUrl,
                contractAddress,
                t,
              );

              return (
                <li key={`${t.urnId}-${t.tokenId}-${t.type}`}>
                  <article
                    className={cn(
                      "relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow] duration-200",
                      "hover:border-primary/25 hover:shadow-md dark:ring-white/10 dark:hover:border-primary/35",
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      aria-label="View NFT on Etherscan"
                      title="View NFT on Etherscan"
                      className="absolute right-2 top-2 z-10 text-muted-foreground hover:text-foreground"
                      render={
                        <a
                          href={nftHref}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <EtherscanLogo data-icon="inline-start" aria-hidden />
                    </Button>

                    <Link
                      href={`/urn/${t.urnId}` as Route}
                      className="group/block block p-4 pt-12 sm:p-5 sm:pt-5"
                    >
                      <div className="flex flex-col items-center gap-3.5">
                        <div className="flex w-full items-center justify-center gap-2.5 sm:gap-4">
                          <div
                            className={cn(
                              "relative size-28 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/50 shadow-sm",
                              "transition-[box-shadow] duration-200 group-hover/block:shadow-md group-hover/block:ring-1 group-hover/block:ring-primary/20",
                              "sm:size-32 md:size-36",
                            )}
                          >
                            {t.imageUrl ? (
                              <Image
                                src={t.imageUrl}
                                alt={title}
                                fill
                                className="object-cover object-center"
                                sizes="144px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[0.7rem] font-medium text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>

                          <ArrowRight
                            className="size-4 shrink-0 text-muted-foreground/30 sm:size-5"
                            strokeWidth={2}
                            aria-hidden
                          />

                          <div
                            className={cn(
                              "relative size-28 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/50 shadow-sm",
                              "sm:size-32 md:size-36",
                            )}
                          >
                            <Image
                              src={`/api/urn/${t.urnId}/image`}
                              alt={urnName}
                              fill
                              className="object-cover object-center"
                              sizes="144px"
                              unoptimized
                            />
                          </div>
                        </div>

                        <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {urnName}
                        </p>

                        <div className="text-center">
                          <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
                            Sent to urn
                          </p>
                          {sentMeta ? (
                            <time
                              dateTime={sentMeta.dateTime}
                              title={sentMeta.absoluteTitle}
                              className="mt-1 block text-sm font-medium text-foreground"
                            >
                              {sentMeta.relative}
                            </time>
                          ) : (
                            <p className="mt-1 max-w-xs text-xs italic leading-snug text-muted-foreground">
                              Date unknown — refresh vault metadata on the urn
                              page
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 border-t border-border/80 pt-4">
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span className="rounded-md bg-muted/80 px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                            {t.type}
                          </span>
                          {t.quantity > 1 ? (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              ×{t.quantity}
                            </span>
                          ) : null}
                          {t.cracked ? (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-destructive">
                              Cracked
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-base font-semibold leading-snug text-foreground">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Open to view vault details
                        </p>
                      </div>
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
