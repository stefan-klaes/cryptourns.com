import { AssetType } from "@/generated/prisma";
import { getAddress, type Address } from "viem";
import type { Asset } from "../Asset";
import type { AlchemyNftPortfolioRow } from "./alchemyNftPortfolio";
import type { RawAlchemyMedia, RawAlchemyOwnedNft } from "./rawTypes";

/** Normalize Alchemy `image` / metadata image fields to a single URL string. */
export function coerceAlchemyImageUrl(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    for (const k of [
      "cachedUrl",
      "pngUrl",
      "thumbnailUrl",
      "originalUrl",
      "gateway",
      "uri",
      "url",
    ]) {
      const v = o[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return null;
}

function parsedRawMetadata(
  raw: RawAlchemyOwnedNft,
): Record<string, unknown> | null {
  const rm = raw.rawMetadata;
  if (typeof rm === "string") {
    try {
      const o = JSON.parse(rm) as unknown;
      return o && typeof o === "object" && !Array.isArray(o)
        ? (o as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (rm && typeof rm === "object" && !Array.isArray(rm)) {
    return rm as Record<string, unknown>;
  }
  return null;
}

function pickNftCollectionName(raw: RawAlchemyOwnedNft): string | null {
  const c = raw.contract;
  if (!c) return null;
  if (typeof c.name === "string" && c.name.trim().length > 0) {
    return c.name.trim();
  }
  const oc = c.openSea?.collectionName;
  if (typeof oc === "string" && oc.trim().length > 0) return oc.trim();
  if (typeof c.symbol === "string" && c.symbol.trim().length > 0) {
    return c.symbol.trim();
  }
  return null;
}

export type AlchemyGetNftsResponse = {
  ownedNfts: RawAlchemyOwnedNft[];
  totalCount?: number;
  pageKey?: string;
  blockHash?: string;
};

/** Parsed JSON from Alchemy `getNFTsForCollection`. */
export type AlchemyGetNftsForCollectionResponse = Record<string, unknown>;

export function extractAlchemyTokenId(raw: RawAlchemyOwnedNft): string | null {
  const tid = raw.id?.tokenId;
  let s: string | null = null;
  if (typeof tid === "string" && tid.length > 0) s = tid;
  if (!s) {
    const alt = (raw as { tokenId?: unknown }).tokenId;
    if (typeof alt === "string" && alt.length > 0) s = alt;
  }
  if (!s) return null;
  try {
    return BigInt(s).toString();
  } catch {
    return s;
  }
}

/**
 * Maps Alchemy `tokenType` to our model; treats UNKNOWN / missing as ERC-721
 * unless balance indicates ERC-1155.
 */
export function inferAlchemyNftStandard(
  raw: RawAlchemyOwnedNft,
): "ERC721" | "ERC1155" | null {
  const tt = (raw.tokenType ?? "").toUpperCase();
  if (tt === "ERC1155") return "ERC1155";
  if (tt === "ERC721") return "ERC721";
  if (tt === "ERC404") return null;
  if (!tt || tt === "UNKNOWN" || tt === "NO_METADATA_NFT") {
    const bal = raw.balance;
    if (typeof bal === "string" && /^\d+$/.test(bal)) {
      try {
        if (BigInt(bal) > BigInt(1)) return "ERC1155";
      } catch {
        /* ignore */
      }
    }
    return "ERC721";
  }
  return null;
}

/**
 * Alchemy `acquiredAt.blockTimestamp`: ISO 8601 string, or Unix time as seconds
 * (typical ~1e9–1e10) or milliseconds (~1e12+). Seconds wrongly passed to
 * `new Date(n)` land in Jan 1970; numeric `0` becomes epoch midnight.
 */
export function coerceAlchemyBlockTimestampToDate(ts: unknown): Date | null {
  if (ts == null) return null;
  if (typeof ts === "number") {
    if (!Number.isFinite(ts) || ts <= 0) return null;
    const ms = ts < 1e12 ? ts * 1000 : ts;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) || d.getTime() === 0 ? null : d;
  }
  if (typeof ts === "string") {
    const s = ts.trim();
    if (s.length === 0) return null;
    if (/^\d+$/.test(s)) {
      const n = Number(s);
      if (!Number.isFinite(n) || n <= 0) return null;
      const ms = n < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) || d.getTime() === 0 ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) || d.getTime() === 0 ? null : d;
  }
  return null;
}

function parseAlchemyAcquiredAtDate(raw: RawAlchemyOwnedNft): Date | null {
  return coerceAlchemyBlockTimestampToDate(raw.acquiredAt?.blockTimestamp);
}

export function parseAlchemyOwnedNft(raw: RawAlchemyOwnedNft): Asset | null {
  const addr = raw.contract?.address;
  if (typeof addr !== "string" || !addr.startsWith("0x")) return null;

  const tokenId = extractAlchemyTokenId(raw);
  if (!tokenId) return null;

  const standard = inferAlchemyNftStandard(raw);
  if (!standard) return null;

  const contractAddress = addr.toLowerCase();
  let quantity = 1;
  if (standard === "ERC1155" && typeof raw.balance === "string") {
    const n = Number.parseInt(raw.balance, 10);
    if (!Number.isNaN(n) && n > 0) quantity = n;
  }

  return {
    contractAddress,
    tokenId,
    type: standard === "ERC721" ? AssetType.ERC721 : AssetType.ERC1155,
    quantity,
    name: null,
    imageUrl: null,
    collectionName: null,
    sentToUrn: parseAlchemyAcquiredAtDate(raw),
  };
}

function pickNftDisplayName(raw: RawAlchemyOwnedNft): string | null {
  const meta = raw.metadata;
  const fromMeta =
    meta && typeof meta.name === "string" ? meta.name.trim() : "";
  const fromMetaTitle =
    meta && typeof meta.title === "string" ? meta.title.trim() : "";
  const parsed = parsedRawMetadata(raw);
  const fromParsedName =
    parsed && typeof parsed.name === "string" ? parsed.name.trim() : "";
  const candidates = [
    fromMeta,
    fromMetaTitle,
    fromParsedName,
    typeof raw.title === "string" ? raw.title.trim() : "",
    typeof raw.name === "string" ? raw.name.trim() : "",
  ];
  for (const t of candidates) {
    if (t.length > 0) return t;
  }
  return null;
}

function pickNftImage(raw: RawAlchemyOwnedNft): string | null {
  const meta = raw.metadata;
  if (meta) {
    const fromMeta =
      coerceAlchemyImageUrl(meta.image) ??
      coerceAlchemyImageUrl(meta.image_url) ??
      coerceAlchemyImageUrl(meta.imageUrl);
    if (fromMeta) return fromMeta;
  }
  const parsed = parsedRawMetadata(raw);
  if (parsed) {
    const fromParsed =
      coerceAlchemyImageUrl(parsed.image) ??
      coerceAlchemyImageUrl(parsed.image_url);
    if (fromParsed) return fromParsed;
  }
  const media = raw.media;
  if (Array.isArray(media)) {
    for (const m of media) {
      if (!m || typeof m !== "object") continue;
      const mm = m as RawAlchemyMedia;
      const u =
        (typeof mm.gateway === "string" && mm.gateway) ||
        (typeof mm.thumbnail === "string" && mm.thumbnail) ||
        (typeof mm.raw === "string" && mm.raw);
      if (u) return u;
    }
  }
  const top = coerceAlchemyImageUrl(raw.image);
  if (top) return top;
  return null;
}

export function parseAlchemyOwnedNftPortfolio(
  raw: RawAlchemyOwnedNft,
): AlchemyNftPortfolioRow | null {
  const base = parseAlchemyOwnedNft(raw);
  if (!base) return null;
  const addr = raw.contract?.address;
  if (typeof addr !== "string" || !addr.startsWith("0x")) return null;
  return {
    contractAddress: getAddress(addr),
    tokenId: base.tokenId,
    standard: base.type === AssetType.ERC721 ? "ERC721" : "ERC1155",
    quantity: base.quantity,
    name: pickNftDisplayName(raw),
    image: pickNftImage(raw),
    collectionName: pickNftCollectionName(raw),
    sentToUrn: base.sentToUrn,
  };
}

/** Parse Alchemy `getNFTMetadata` JSON into display fields. */
export function extractDisplayFromGetNFTMetadataResponse(
  data: Record<string, unknown>,
): {
  name: string | null;
  image: string | null;
  collectionName: string | null;
} {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  let name: string | null = null;
  if (metadata && typeof metadata.name === "string" && metadata.name.trim()) {
    name = metadata.name.trim();
  } else if (title.length > 0) {
    name = title;
  }

  let image: string | null = null;
  if (metadata) {
    image =
      coerceAlchemyImageUrl(metadata.image) ??
      coerceAlchemyImageUrl(metadata.image_url) ??
      coerceAlchemyImageUrl(metadata.imageUrl);
  }
  if (!image && Array.isArray(data.media)) {
    for (const m of data.media) {
      if (!m || typeof m !== "object") continue;
      const mm = m as Record<string, unknown>;
      const u =
        (typeof mm.gateway === "string" && mm.gateway) ||
        (typeof mm.thumbnail === "string" && mm.thumbnail) ||
        (typeof mm.raw === "string" && mm.raw);
      if (u) {
        image = u;
        break;
      }
    }
  }
  if (!image) {
    image = coerceAlchemyImageUrl(data.image);
  }

  let collectionName: string | null = null;
  const contractMetadata = data.contractMetadata as
    | Record<string, unknown>
    | undefined;
  if (contractMetadata) {
    if (
      typeof contractMetadata.name === "string" &&
      contractMetadata.name.trim()
    ) {
      collectionName = contractMetadata.name.trim();
    } else if (
      typeof contractMetadata.symbol === "string" &&
      contractMetadata.symbol.trim()
    ) {
      collectionName = contractMetadata.symbol.trim();
    }
  }
  const contract = data.contract as Record<string, unknown> | undefined;
  if (!collectionName && contract && typeof contract.name === "string") {
    collectionName = contract.name.trim();
  }

  const openSea = data.openSea as Record<string, unknown> | undefined;
  if (
    !name &&
    openSea &&
    typeof openSea.name === "string" &&
    openSea.name.trim()
  ) {
    name = openSea.name.trim();
  }
  if (!image && openSea) {
    image =
      coerceAlchemyImageUrl(openSea.imageUrl) ??
      coerceAlchemyImageUrl(openSea.image_original_url);
  }
  if (
    !collectionName &&
    openSea &&
    typeof openSea.collectionName === "string" &&
    openSea.collectionName.trim()
  ) {
    collectionName = openSea.collectionName.trim();
  }

  return { name, image, collectionName };
}
