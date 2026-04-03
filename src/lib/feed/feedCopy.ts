import { AssetType } from "@/generated/prisma";
import { buildUrnImageCacheHash } from "@/lib/urn/urnImageCacheHash";
import type { UrnWithListInclude } from "@/lib/urn/toUrnMetadata";
import { shortenAddress } from "@/lib/utils/shortenAddress";
import { getAddress, isAddress } from "viem";

import { urnVaultCounts } from "./urnVaultCounts";

function safeChecksummed(addr: string): string {
  if (!isAddress(addr)) return addr;
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}

function shortContract(addr: string): string {
  if (!addr.startsWith("0x") || addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function assetOccurredAt(row: {
  sentToUrn: Date | null;
  createdAt: Date;
}): Date {
  return row.sentToUrn ?? row.createdAt;
}

export type FeedExplorerLink = {
  href: string;
  label: string;
};

/** Wallet that performed the action (minter, candle lighter, depositor). */
export type FeedCreator = {
  display: string;
  /** Etherscan (or chain explorer) address page; null if unknown. */
  addressExplorerHref: string | null;
};

export type FeedItemPayload = {
  key: string;
  /** ISO 8601, used for sorting and `datetime` on `<time>` */
  occurredAtIso: string;
  timeLabel: string;
  headline: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  urnHref: string;
  urnId: number;
  creator: FeedCreator;
  /** Link to /tx/… when a tx hash is known (mint, indexed vault deposit). */
  transactionExplorer?: FeedExplorerLink;
};

type MintRow = {
  id: number;
  mintedAt: Date;
  mintTx: string;
  mintedBy: string;
};

type CandleWithUrn = {
  urnId: number;
  address: string;
  createdAt: Date;
  urn: UrnWithListInclude;
};

type AssetWithUrnRow = {
  id: number;
  urnId: number;
  contractAddress: string;
  tokenId: string;
  type: AssetType;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
  sentToUrn: Date | null;
  createdAt: Date;
  urn: UrnWithListInclude;
};

function explorerBase(explorerBaseUrl: string) {
  return explorerBaseUrl.replace(/\/$/, "");
}

function addressExplorerHref(
  explorerBaseUrl: string,
  address: string,
): string | null {
  const trimmed = address?.trim();
  if (!trimmed || !isAddress(trimmed)) return null;
  const base = explorerBase(explorerBaseUrl);
  return `${base}/address/${safeChecksummed(trimmed)}`;
}

export function mintFeedItem(
  row: MintRow,
  explorerBaseUrl: string,
  timeLabel: string,
): FeedItemPayload {
  const base = explorerBase(explorerBaseUrl);
  const creatorHref = addressExplorerHref(explorerBaseUrl, row.mintedBy);
  const creatorDisplay =
    creatorHref != null ? shortenAddress(row.mintedBy) : "Unknown wallet";

  return {
    key: `mint-${row.id}`,
    occurredAtIso: row.mintedAt.toISOString(),
    timeLabel,
    headline: `Minted Cryptourn #${row.id}`,
    text: "A fresh empty urn joined the collection.",
    imageSrc: `/api/urn/${row.id}/image?variant=empty`,
    imageAlt: `Cryptourn #${row.id} — empty urn`,
    urnHref: `/urn/${row.id}`,
    urnId: row.id,
    creator: {
      display: creatorDisplay,
      addressExplorerHref: creatorHref,
    },
    transactionExplorer:
      row.mintTx?.trim().length > 0
        ? {
            href: `${base}/tx/${row.mintTx}`,
            label: "Mint transaction",
          }
        : undefined,
  };
}

export function candleFeedItem(
  row: CandleWithUrn,
  explorerBaseUrl: string,
  timeLabel: string,
): FeedItemPayload {
  const creatorHref = addressExplorerHref(explorerBaseUrl, row.address);
  const creatorDisplay =
    creatorHref != null ? shortenAddress(row.address) : "Unknown wallet";
  const counts = urnVaultCounts(row.urn);
  const h = buildUrnImageCacheHash({
    nftCount: counts.nftCount,
    coinCount: counts.coinCount,
    candleCount: counts.candleCount,
    cracked: counts.cracked,
  });

  return {
    key: `candle-${row.urnId}-${row.address}-${row.createdAt.toISOString()}`,
    occurredAtIso: row.createdAt.toISOString(),
    timeLabel,
    headline: "Lit a candle",
    text: `On Cryptourn #${row.urnId}.`,
    imageSrc: `/api/urn/${row.urnId}/image?h=${h}`,
    imageAlt: `Cryptourn #${row.urnId}`,
    urnHref: `/urn/${row.urnId}`,
    urnId: row.urnId,
    creator: {
      display: creatorDisplay,
      addressExplorerHref: creatorHref,
    },
  };
}

function assetTypeLabel(type: AssetType): string {
  switch (type) {
    case AssetType.ERC721:
      return "ERC-721";
    case AssetType.ERC1155:
      return "ERC-1155";
    default:
      return "ERC-20";
  }
}

export function assetFeedItem(
  row: AssetWithUrnRow,
  explorerBaseUrl: string,
  timeLabel: string,
  /** Resolved http(s) URL for the asset (DB + optional Alchemy); urn art if null. */
  assetImageUrl: string | null,
  /** Latest indexed IN transfer for this vault line, if any. */
  latestInTransfer: { txHash: string; fromAddress: string } | null,
): FeedItemPayload {
  const base = explorerBase(explorerBaseUrl);
  const at = assetOccurredAt(row);
  const counts = urnVaultCounts(row.urn);
  const h = buildUrnImageCacheHash({
    nftCount: counts.nftCount,
    coinCount: counts.coinCount,
    candleCount: counts.candleCount,
    cracked: counts.cracked,
  });
  const urnImageSrc = `/api/urn/${row.urnId}/image?h=${h}`;

  const typeLabel = assetTypeLabel(row.type);
  const name = row.name?.trim();
  const collection = row.collectionName?.trim();
  const displayName =
    name ||
    (row.type === AssetType.ERC20
      ? collection || "ERC-20 tokens"
      : `Token #${row.tokenId}`);

  const metaParts: string[] = [typeLabel, shortContract(row.contractAddress)];
  if (row.quantity > 1) {
    metaParts.push(`×${row.quantity}`);
  }
  if (collection && collection !== name) {
    metaParts.push(collection);
  }

  const fromAddr = latestInTransfer?.fromAddress ?? "";
  const creatorHref = addressExplorerHref(explorerBaseUrl, fromAddr);
  const creatorDisplay =
    creatorHref != null ? shortenAddress(fromAddr) : "Unknown sender";

  return {
    key: `asset-${row.id}`,
    occurredAtIso: at.toISOString(),
    timeLabel,
    headline: displayName,
    text: `Sent to Cryptourn #${row.urnId} · ${metaParts.join(" · ")}`,
    imageSrc: assetImageUrl ?? urnImageSrc,
    imageAlt: displayName,
    urnHref: `/urn/${row.urnId}`,
    urnId: row.urnId,
    creator: {
      display: creatorDisplay,
      addressExplorerHref: creatorHref,
    },
    transactionExplorer:
      latestInTransfer?.txHash?.trim().length
        ? {
            href: `${base}/tx/${latestInTransfer.txHash}`,
            label: "Deposit transaction",
          }
        : undefined,
  };
}
