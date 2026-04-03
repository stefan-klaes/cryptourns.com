import { EtherscanLogo } from "@/components/brand-icons/EtherscanLogo";
import { VaultCollectionErc721CardToolbar } from "@/components/collections/VaultCollectionErc721CardToolbar";
import { Button } from "@/components/ui/button";
import { explorerHrefForCollection } from "@/lib/collections/explorerHrefForCollection";
import type {
  VaultCollectionDisplayMeta,
  VaultCollectionErc721Token,
  VaultCollectionFungibleUrnLine,
  VaultCollectionFungibleUrnRow,
} from "@/lib/collections/getVaultCollectionDetail";
import type { AssetType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
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

function explorerHrefForErc721(
  explorerBaseUrl: string,
  contractAddress: string,
  tokenId: string,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(contractAddress);
  return `${base}/nft/${contract}/${tokenId}`;
}

function explorerHrefForFungibleLine(
  explorerBaseUrl: string,
  contractAddress: string,
  line: VaultCollectionFungibleUrnLine,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(contractAddress);
  if (line.type === "ERC20") {
    return `${base}/token/${contract}`;
  }
  return `${base}/token/${contract}?a=${encodeURIComponent(line.tokenId)}`;
}

type VaultCollectionDetailProps = {
  contractAddress: string;
  meta: VaultCollectionDisplayMeta | null;
  types: AssetType[];
  erc721Tokens: VaultCollectionErc721Token[];
  fungibleUrns: VaultCollectionFungibleUrnRow[];
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

function lineSummary(line: VaultCollectionFungibleUrnLine): string {
  if (line.type === "ERC20") {
    const label = line.name?.trim() || "Token balance";
    return `${label} ×${line.quantity.toLocaleString()}`;
  }
  const title = line.name?.trim() || `Token #${line.tokenId}`;
  return line.quantity > 1 ? `${title} ×${line.quantity}` : title;
}

export function VaultCollectionDetail({
  contractAddress,
  meta,
  types,
  erc721Tokens,
  fungibleUrns,
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

  const showErc721Section = types.includes("ERC721");
  const showFungibleSection =
    types.includes("ERC1155") || types.includes("ERC20");

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
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              title="View on Etherscan"
              aria-label="View on Etherscan"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              render={
                <a
                  href={explorerHref}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <EtherscanLogo className="size-4" aria-hidden />
            </Button>
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

      {showErc721Section ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              NFTs in vaults
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each ERC-721 token from this contract held in an urn, one card per
              token.
            </p>
          </div>
          {erc721Tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ERC-721 rows indexed for this contract yet.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {erc721Tokens.map((t) => {
                const title = t.name?.trim() || `Token #${t.tokenId}`;
                const nftHref = explorerHrefForErc721(
                  explorerBaseUrl,
                  contractAddress,
                  t.tokenId,
                );
                return (
                  <li key={t.tokenId}>
                    <article
                      className={cn(
                        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow] duration-200",
                        "hover:border-primary/25 hover:shadow-md dark:ring-white/10 dark:hover:border-primary/35",
                      )}
                    >
                      <VaultCollectionErc721CardToolbar
                        urnId={t.urnId}
                        nftHref={nftHref}
                      />
                      <div className="relative aspect-square w-full bg-muted/50">
                        {t.imageUrl ? (
                          <Image
                            src={t.imageUrl}
                            alt={title}
                            fill
                            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 border-t border-border/80 p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                          {title}
                        </p>
                        <p className="font-mono text-[0.65rem] text-muted-foreground">
                          #{t.tokenId}
                        </p>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {showFungibleSection ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Urns holding this asset
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cryptourns whose vaults contain ERC-1155 or ERC-20 from this
              contract.
            </p>
          </div>
          {fungibleUrns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ERC-1155 or coin balances indexed for this contract yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fungibleUrns.map((u) => {
                const urnName = `Cryptourn #${u.urnId}`;
                return (
                  <li key={u.urnId}>
                    <article
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-sm ring-1 ring-black/5 transition-[border-color,box-shadow] duration-200",
                        "hover:border-primary/25 hover:shadow-md dark:ring-white/10 dark:hover:border-primary/35",
                      )}
                    >
                      <Link
                        href={`/urn/${u.urnId}` as Route}
                        className="group/block block p-4 sm:p-5"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className={cn(
                              "relative size-32 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/50 shadow-sm",
                              "transition-[box-shadow] duration-200 group-hover/block:shadow-md group-hover/block:ring-1 group-hover/block:ring-primary/20",
                              "sm:size-36",
                            )}
                          >
                            <Image
                              src={`/api/urn/${u.urnId}/image`}
                              alt={urnName}
                              fill
                              className="object-cover object-center"
                              sizes="144px"
                              unoptimized
                            />
                          </div>
                          <p className="text-center text-sm font-semibold text-foreground">
                            {urnName}
                          </p>
                          {u.cracked ? (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-destructive">
                              Cracked
                            </span>
                          ) : null}
                        </div>

                        <ul className="mt-4 space-y-2 border-t border-border/80 pt-4">
                          {u.lines.map((line, i) => {
                            const href = explorerHrefForFungibleLine(
                              explorerBaseUrl,
                              contractAddress,
                              line,
                            );
                            return (
                              <li key={`${line.type}-${line.tokenId}-${i}`}>
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs transition-colors hover:bg-muted/70"
                                >
                                  <span className="min-w-0 flex-1 truncate text-foreground">
                                    {lineSummary(line)}
                                  </span>
                                  <span className="shrink-0 rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase text-muted-foreground">
                                    {line.type}
                                  </span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                        <p className="mt-3 text-center text-xs text-muted-foreground">
                          Open urn for vault details
                        </p>
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
