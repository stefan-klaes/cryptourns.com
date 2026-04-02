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

function explorerHrefForFeedAsset(
  explorerBaseUrl: string,
  contractAddress: string,
  tokenId: string,
  type: AssetType,
): string {
  const base = explorerBaseUrl.replace(/\/$/, "");
  const contract = safeChecksummed(contractAddress);
  if (type === AssetType.ERC20) {
    return `${base}/token/${contract}`;
  }
  if (type === AssetType.ERC721) {
    return `${base}/nft/${contract}/${tokenId}`;
  }
  return `${base}/token/${contract}?a=${encodeURIComponent(tokenId)}`;
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

export type FeedItemPayload = {
  key: string;
  /** ISO 8601, used for sorting and `datetime` on `<time>` */
  occurredAtIso: string;
  timeLabel: string;
  title: string;
  text: string;
  imageSrc: string;
  imageAlt: string;
  urnHref: string;
  explorer?: FeedExplorerLink;
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

export function mintFeedItem(
  row: MintRow,
  explorerBaseUrl: string,
  timeLabel: string,
): FeedItemPayload {
  const base = explorerBase(explorerBaseUrl);
  const minter = shortenAddress(row.mintedBy);

  return {
    key: `mint-${row.id}`,
    occurredAtIso: row.mintedAt.toISOString(),
    timeLabel,
    title: `Minted Cryptourn #${row.id}`,
    text:
      minter.length > 0
        ? `A fresh empty urn joined the collection — minter ${minter}.`
        : "A fresh empty urn joined the collection.",
    imageSrc: `/api/urn/${row.id}/image?variant=empty`,
    imageAlt: `Cryptourn #${row.id} — empty urn`,
    urnHref: `/urn/${row.id}`,
    explorer: {
      href: `${base}/tx/${row.mintTx}`,
      label: "Mint transaction",
    },
  };
}

export function candleFeedItem(
  row: CandleWithUrn,
  explorerBaseUrl: string,
  timeLabel: string,
): FeedItemPayload {
  const base = explorerBase(explorerBaseUrl);
  const who = shortenAddress(row.address);
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
    title: `${who} lit a candle`,
    text: `For Cryptourn #${row.urnId}.`,
    imageSrc: `/api/urn/${row.urnId}/image?h=${h}`,
    imageAlt: `Cryptourn #${row.urnId}`,
    urnHref: `/urn/${row.urnId}`,
    explorer: {
      href: `${base}/address/${row.address}`,
      label: "Wallet on explorer",
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
): FeedItemPayload {
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

  return {
    key: `asset-${row.id}`,
    occurredAtIso: at.toISOString(),
    timeLabel,
    title: `${displayName} sent to Cryptourn #${row.urnId}`,
    text: metaParts.join(" · "),
    imageSrc: assetImageUrl ?? urnImageSrc,
    imageAlt: displayName,
    urnHref: `/urn/${row.urnId}`,
    explorer: {
      href: explorerHrefForFeedAsset(
        explorerBaseUrl,
        row.contractAddress,
        row.tokenId,
        row.type,
      ),
      label: "Token on explorer",
    },
  };
}
