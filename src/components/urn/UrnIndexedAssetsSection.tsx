"use client";

import { ResponsiveSheet } from "@/components/ResponsiveSheet";
import { WithdrawFromUrnPanel } from "@/components/urn/WithdrawFromUrnPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSentToUrnRelative } from "@/lib/time/formatSentToUrn";
import type { UrnIndexedAssetRow } from "@/lib/urn/getUrnIndexedAssets";
import { isVaultCryptournSelfAsset } from "@/lib/urn/isVaultCryptournSelfAsset";
import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { useAccount } from "wagmi";

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

function explorerHrefForAsset(
  explorerBaseUrl: string,
  row: UrnIndexedAssetRow,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(row.contractAddress);
  if (row.type === "ERC20") {
    return `${base}/token/${contract}`;
  }
  if (row.type === "ERC721") {
    return `${base}/nft/${contract}/${row.tokenId}`;
  }
  return `${base}/token/${contract}?a=${encodeURIComponent(row.tokenId)}`;
}

export type UrnIndexedAssetsWithdrawConfig = {
  tbaAddress: Address;
  chainName: string;
  cracked: boolean;
  candleCount: number;
  ownerAddress: string | null;
};

type UrnIndexedAssetsSectionProps = {
  urnId: number;
  explorerBaseUrl: string;
  coins: UrnIndexedAssetRow[];
  nfts: UrnIndexedAssetRow[];
  withdraw?: UrnIndexedAssetsWithdrawConfig | null;
};

export function UrnIndexedAssetsSection({
  urnId,
  explorerBaseUrl,
  coins,
  nfts,
  withdraw,
}: UrnIndexedAssetsSectionProps) {
  const { address, isConnected } = useAccount();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<UrnIndexedAssetRow | null>(
    null,
  );

  const defaultTab = nfts.length > 0 || coins.length === 0 ? "nfts" : "coins";
  const totalCount = nfts.length + coins.length;
  const holdingsTitle =
    totalCount === 0
      ? `Cryptourn #${urnId} owns no assets`
      : totalCount === 1
        ? `Cryptourn #${urnId} owns 1 asset`
        : `Cryptourn #${urnId} owns ${totalCount.toLocaleString()} assets`;

  const showWithdraw =
    Boolean(withdraw) &&
    Boolean(withdraw!.ownerAddress && address) &&
    withdraw!.ownerAddress!.toLowerCase() === address!.toLowerCase() &&
    isConnected;

  const openWithdraw = (row: UrnIndexedAssetRow) => {
    setWithdrawTarget(row);
    setSheetOpen(true);
  };

  const closeWithdrawSheet = () => {
    setSheetOpen(false);
    setWithdrawTarget(null);
  };

  return (
    <section
      className="mt-12 rounded-2xl border border-border bg-card/80 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm dark:ring-white/10 sm:p-6"
      aria-labelledby="indexed-vault-assets-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2
          id="indexed-vault-assets-heading"
          className="text-base font-semibold tracking-tight text-foreground sm:text-lg"
        >
          {holdingsTitle}
        </h2>
        <Link
          href={`/urn/${urnId}/transfers` as Route}
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Transfer history
        </Link>
      </div>

      <Tabs
        defaultValue={defaultTab}
        className="mt-5 flex flex-col gap-4"
      >
        <TabsList
          variant="line"
          className="inline-flex h-9 w-fit max-w-md shrink-0"
        >
          <TabsTrigger value="nfts" className="flex-none px-3">
            NFTs ({nfts.length})
          </TabsTrigger>
          <TabsTrigger value="coins" className="flex-none px-3">
            Coins ({coins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nfts" className="flex flex-col gap-2">
          {nfts.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No NFTs indexed for this vault yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {nfts.map((row) => {
                const href = explorerHrefForAsset(explorerBaseUrl, row);
                const contract = safeChecksummed(row.contractAddress);
                const label = shortHex(contract);
                const title =
                  row.name?.trim() ||
                  `Token #${row.tokenId}`;
                const sentMeta = formatSentToUrnRelative(row.sentToUrn);
                const selfBlocked = isVaultCryptournSelfAsset(urnId, row);
                return (
                  <li
                    key={`${row.contractAddress}-${row.tokenId}-${row.type}`}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                        {row.imageUrl ? (
                          <Image
                            src={row.imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center text-[0.65rem] font-medium text-muted-foreground"
                            aria-hidden
                          >
                            NFT
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                            {row.type}
                          </span>
                          {row.quantity > 1 ? (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              ×{row.quantity}
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-sm font-medium text-foreground">
                          {title}
                        </p>
                        {row.collectionName?.trim() ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {row.collectionName.trim()}
                          </p>
                        ) : null}
                        {sentMeta ? (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              In urn since
                            </span>{" "}
                            <time
                              dateTime={sentMeta.dateTime}
                              title={sentMeta.absoluteTitle}
                              className="text-muted-foreground"
                            >
                              {sentMeta.relative}
                            </time>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/80 italic">
                            In urn since unknown — refresh metadata to index.
                          </p>
                        )}
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block max-w-full truncate font-mono text-xs text-primary underline-offset-2 hover:underline"
                          title={contract}
                        >
                          {label}
                        </a>
                      </div>
                    </div>
                    {showWithdraw ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                        disabled={selfBlocked}
                        title={
                          selfBlocked
                            ? "This urn cannot be withdrawn from its own vault"
                            : undefined
                        }
                        onClick={() => openWithdraw(row)}
                      >
                        Withdraw
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="coins" className="flex flex-col gap-2">
          {coins.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No ERC-20 balances indexed for this vault yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {coins.map((row) => {
                const href = explorerHrefForAsset(explorerBaseUrl, row);
                const contract = safeChecksummed(row.contractAddress);
                const label = shortHex(contract);
                return (
                  <li
                    key={`${row.contractAddress}-${row.tokenId}`}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block max-w-full truncate font-mono text-sm text-primary underline-offset-2 hover:underline"
                        title={contract}
                      >
                        {label}
                      </a>
                      {row.tokenId !== "0" && row.tokenId !== "" ? (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          Ref #{row.tokenId}
                        </p>
                      ) : null}
                      <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
                        {row.quantity.toLocaleString()} units
                      </p>
                    </div>
                    {showWithdraw ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                        onClick={() => openWithdraw(row)}
                      >
                        Withdraw
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {withdraw && showWithdraw ? (
        <ResponsiveSheet
          open={sheetOpen}
          onOpenChange={(next) => {
            if (!next) closeWithdrawSheet();
            else setSheetOpen(true);
          }}
          title="Withdraw from vault"
          description="Confirm recipient and amount, then sign with your wallet."
          sheetSide="right"
          sheetContentClassName="!w-[min(100vw-1.25rem,22rem)] sm:!w-[min(100vw-2rem,28rem)] sm:!max-w-[min(100vw-2rem,28rem)]"
          drawerContentClassName="mx-auto w-[calc(100vw-1rem)] max-w-[28rem]"
        >
          {sheetOpen ? (
            <WithdrawFromUrnPanel
              embedded
              open={sheetOpen}
              urnId={urnId}
              tbaAddress={withdraw.tbaAddress}
              chainName={withdraw.chainName}
              cracked={withdraw.cracked}
              candleCount={withdraw.candleCount}
              indexedCoins={coins}
              indexedNfts={nfts}
              isConnected={isConnected}
              entryRow={withdrawTarget}
              backClosesSheet
              onRequestClose={closeWithdrawSheet}
            />
          ) : null}
        </ResponsiveSheet>
      ) : null}
    </section>
  );
}
