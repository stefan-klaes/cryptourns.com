import type { UrnAssetTransferRow } from "@/lib/urn/getUrnAssetTransfers";
import Image from "next/image";
import type { Route } from "next";
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

function explorerHrefForRow(
  explorerBaseUrl: string,
  row: UrnAssetTransferRow,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(row.contractAddress);
  if (row.assetType === "ERC20") {
    return `${base}/token/${contract}`;
  }
  if (row.assetType === "ERC721") {
    return `${base}/nft/${contract}/${row.tokenId}`;
  }
  return `${base}/token/${contract}?a=${encodeURIComponent(row.tokenId)}`;
}

type UrnInboundTransfersViewProps = {
  urnId: number;
  urnDisplayName: string;
  transfers: UrnAssetTransferRow[];
  explorerBaseUrl: string;
};

export function UrnInboundTransfersView({
  urnId,
  urnDisplayName,
  transfers,
  explorerBaseUrl,
}: UrnInboundTransfersViewProps) {
  const base = explorerBaseUrl.replace(/\/$/, "");

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[420px] w-[70%] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[380px] w-[60%] rounded-full bg-chart-2/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link
            href="/urns"
            className="transition-colors hover:text-foreground"
          >
            Urns
          </Link>
          <span className="mx-2 text-border">/</span>
          <Link
            href={`/urn/${urnId}` as Route}
            className="transition-colors hover:text-foreground"
          >
            {urnDisplayName}
          </Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">Transfers</span>
        </nav>

        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Asset transfers
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground sm:text-base">
            ERC-20, ERC-721, and ERC-1155 movements in and out of Cryptourn #
            {urnId} (newest first).
          </p>
        </header>

        {transfers.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card/80 px-5 py-10 text-center text-sm text-muted-foreground">
            No transfers recorded for this vault yet. Open the urn page once to
            sync from the indexer.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10">
            {transfers.map((row) => {
              const assetHref = explorerHrefForRow(explorerBaseUrl, row);
              const contract = safeChecksummed(row.contractAddress);
              const counterparty = safeChecksummed(row.counterpartyAddress);
              const title =
                row.name?.trim() ||
                (row.assetType === "ERC20"
                  ? row.contractAddress
                  : `Token #${row.tokenId}`);
              const typeLabel = row.assetType;

              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:gap-5 sm:px-5 sm:py-5"
                >
                  <div className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/40 sm:mx-0">
                    {row.imageUrl ? (
                      <Image
                        src={row.imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center px-1 text-center text-[0.65rem] font-medium leading-tight text-muted-foreground">
                        {row.assetType === "ERC20" ? "ERC-20" : typeLabel}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          row.direction === "IN"
                            ? "rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide text-emerald-700 dark:text-emerald-400"
                            : "rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide text-amber-800 dark:text-amber-400"
                        }
                      >
                        {row.direction === "IN" ? "In" : "Out"}
                      </span>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                        {typeLabel}
                      </span>
                      <span className="text-sm font-medium tabular-nums text-foreground">
                        ×{row.quantityLabel}
                      </span>
                    </div>
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {title}
                    </p>
                    {row.collectionName?.trim() ? (
                      <p className="text-sm text-muted-foreground">
                        {row.collectionName.trim()}
                      </p>
                    ) : null}
                    <a
                      href={assetHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block max-w-full truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
                      title={contract}
                    >
                      {shortHex(contract)}
                    </a>
                  </div>

                  <div className="shrink-0 space-y-2 border-t border-border pt-3 text-sm sm:w-[min(100%,220px)] sm:border-t-0 sm:pt-0 sm:text-right">
                    <div className="text-muted-foreground sm:text-right">
                      <p className="text-xs font-medium tracking-wide uppercase">
                        Date
                      </p>
                      {row.transferAtIso ? (
                        <time
                          dateTime={row.transferAtIso}
                          className="block text-foreground"
                        >
                          {new Date(row.transferAtIso).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      ) : (
                        <span className="text-foreground/70">Unknown</span>
                      )}
                    </div>
                    <div className="text-muted-foreground sm:text-right">
                      <p className="text-xs font-medium tracking-wide uppercase">
                        {row.direction === "IN" ? "From" : "To"}
                      </p>
                      {counterparty.startsWith("0x") ? (
                        <a
                          href={`${base}/address/${counterparty}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block max-w-full truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
                          title={counterparty}
                        >
                          {shortHex(counterparty)}
                        </a>
                      ) : (
                        <span className="text-foreground/70">
                          {counterparty}
                        </span>
                      )}
                    </div>
                    {row.txHash ? (
                      <div className="text-muted-foreground sm:text-right">
                        <p className="text-xs font-medium tracking-wide uppercase">
                          Tx
                        </p>
                        <a
                          href={`${base}/tx/${row.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block max-w-full truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {shortHex(row.txHash)}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
