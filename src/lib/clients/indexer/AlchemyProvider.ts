import { AssetType } from "@/generated/prisma";
import { isCryptournsMainnet } from "@/lib/chains/cryptournsChain";
import { ZERO_ADDRESS } from "@/lib/constants/zeroAddress";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { getAddress, type Address } from "viem";
import type { Asset } from "./Asset";

type RawAlchemyMedia = {
  gateway?: string;
  raw?: string;
  thumbnail?: string;
  format?: string;
};

type RawAlchemyContract = {
  address?: string;
  name?: string;
  symbol?: string;
  openSea?: { collectionName?: string };
};

type RawAlchemyOwnedNft = {
  contract?: RawAlchemyContract;
  id?: { tokenId?: string };
  tokenType?: string;
  balance?: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string | Record<string, unknown>;
  media?: RawAlchemyMedia[];
  metadata?: Record<string, unknown>;
  /** Sometimes a stringified JSON object from Alchemy. */
  rawMetadata?: unknown;
};

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
  };
}

/** Display fields for wallet portfolio (Alchemy `getNFTs` with `withMetadata`). */
export type AlchemyNftPortfolioRow = {
  contractAddress: Address;
  tokenId: string;
  standard: "ERC721" | "ERC1155";
  quantity: number;
  name: string | null;
  image: string | null;
  collectionName: string | null;
};

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
  };
}

function mergePortfolioNftRows(
  primary: AlchemyNftPortfolioRow[],
  secondary: AlchemyNftPortfolioRow[],
): AlchemyNftPortfolioRow[] {
  const key = (r: AlchemyNftPortfolioRow) =>
    `${r.contractAddress.toLowerCase()}-${r.tokenId}`;
  const map = new Map<string, AlchemyNftPortfolioRow>();
  for (const r of primary) {
    map.set(key(r), r);
  }
  for (const r of secondary) {
    const k = key(r);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, r);
      continue;
    }
    if (
      (!existing.name && r.name) ||
      (!existing.image && r.image) ||
      (!existing.collectionName && r.collectionName)
    ) {
      map.set(k, {
        ...existing,
        name: existing.name || r.name || null,
        image: existing.image || r.image || null,
        collectionName: existing.collectionName || r.collectionName || null,
      });
    }
  }
  return [...map.values()];
}

/** Parse Alchemy `getNFTMetadata` JSON into display fields. */
function extractDisplayFromGetNFTMetadataResponse(
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

type AlchemyTokenBalancesResult = {
  address: string;
  tokenBalances: {
    contractAddress: string;
    tokenBalance: string | null;
    error?: string | null;
  }[];
};

export class AlchemyProvider {
  readonly name = "Alchemy" as const;

  private readonly apiKey: string;
  private readonly host: string;

  constructor() {
    const key = process.env.ALCHEMY_API_KEY;
    if (!key) {
      throw new Error("Missing ALCHEMY_API_KEY");
    }
    this.apiKey = key;
    this.host = isCryptournsMainnet()
      ? "eth-mainnet.g.alchemy.com"
      : "eth-sepolia.g.alchemy.com";
  }

  private async fetchNftsPage(
    owner: string,
    pageKey: string | undefined,
    withMetadata: boolean,
    options?: { includeSpam?: boolean; contractAddresses?: Address[] },
  ): Promise<AlchemyGetNftsResponse> {
    const url = new URL(`https://${this.host}/nft/v2/${this.apiKey}/getNFTs`);
    url.searchParams.set("owner", owner);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("withMetadata", withMetadata ? "true" : "false");
    if (options?.includeSpam) {
      url.searchParams.set("includeSpam", "true");
    }
    if (options?.contractAddresses) {
      for (const c of options.contractAddresses) {
        url.searchParams.append("contractAddresses", getAddress(c));
      }
    }
    if (pageKey) {
      url.searchParams.set("pageKey", pageKey);
    }

    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Alchemy getNFTs failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    return res.json() as Promise<AlchemyGetNftsResponse>;
  }

  async getNfts(owner: string, pageKeyUnused?: string): Promise<Asset[]> {
    void pageKeyUnused;
    const portfolio: AlchemyNftPortfolioRow[] = [];
    let pageKey: string | undefined;
    do {
      const res = await this.fetchNftsPage(owner, pageKey, true, undefined);
      for (const raw of res.ownedNfts) {
        const parsed = parseAlchemyOwnedNftPortfolio(raw);
        if (parsed) portfolio.push(parsed);
      }
      pageKey = res.pageKey;
    } while (pageKey);

    const enrich = true;
    const rows = enrich
      ? await this.enrichPortfolioRowsIfSparse(portfolio)
      : portfolio;

    return rows.map((r) => ({
      contractAddress: r.contractAddress.toLowerCase(),
      tokenId: r.tokenId,
      type: r.standard === "ERC721" ? AssetType.ERC721 : AssetType.ERC1155,
      quantity: r.quantity,
      name: r.name,
      imageUrl: r.image,
      collectionName: r.collectionName,
    }));
  }

  private async fetchAllPortfolioPages(
    owner: string,
    options?: { includeSpam?: boolean; contractAddresses?: Address[] },
  ): Promise<AlchemyNftPortfolioRow[]> {
    const out: AlchemyNftPortfolioRow[] = [];
    let pageKey: string | undefined;
    do {
      const res = await this.fetchNftsPage(owner, pageKey, true, options);
      for (const raw of res.ownedNfts) {
        const parsed = parseAlchemyOwnedNftPortfolio(raw);
        if (parsed) out.push(parsed);
      }
      pageKey = res.pageKey;
    } while (pageKey);
    return out;
  }

  /**
   * Owner’s Cryptourns ERC-721s only — one Alchemy `getNFTs` pass with
   * `contractAddresses` set to the Cryptourns collection (with spam included).
   */
  async getCryptournsNftsForOwner(
    owner: string,
  ): Promise<AlchemyNftPortfolioRow[]> {
    return this.fetchAllPortfolioPages(owner, {
      includeSpam: true,
      contractAddresses: [CRYPTOURNS_CONTRACT.address],
    });
  }

  /**
   * Two Alchemy `getNFTs` passes in parallel: full owner index (with spam) and
   * Cryptourns contract only. The contract-scoped rows are merged in so the broad
   * index does not omit collection NFTs.
   */
  async getPortfolioNftSlices(owner: string): Promise<{
    merged: AlchemyNftPortfolioRow[];
    cryptournsOnly: AlchemyNftPortfolioRow[];
  }> {
    const baseOpts = { includeSpam: true as const };
    const [main, cryptournsOnly] = await Promise.all([
      this.fetchAllPortfolioPages(owner, baseOpts),
      this.getCryptournsNftsForOwner(owner),
    ]);
    return {
      merged: mergePortfolioNftRows(main, cryptournsOnly),
      cryptournsOnly,
    };
  }

  /** Merged portfolio rows (see {@link getPortfolioNftSlices}). */
  async getNftsForPortfolio(owner: string): Promise<AlchemyNftPortfolioRow[]> {
    const { merged } = await this.getPortfolioNftSlices(owner);
    return merged;
  }

  private async fetchGetNFTMetadataEnrichment(
    contractAddress: Address,
    tokenId: string,
    standard: "ERC721" | "ERC1155",
  ): Promise<{
    name: string | null;
    image: string | null;
    collectionName: string | null;
  }> {
    const url = new URL(
      `https://${this.host}/nft/v2/${this.apiKey}/getNFTMetadata`,
    );
    url.searchParams.set("contractAddress", getAddress(contractAddress));
    url.searchParams.set("tokenId", tokenId);
    url.searchParams.set("tokenType", standard);
    url.searchParams.set("tokenUriTimeoutInMs", "10000");
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      return { name: null, image: null, collectionName: null };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return extractDisplayFromGetNFTMetadataResponse(data);
  }

  /**
   * Fetches `getNFTMetadata` for rows missing any of name, image, or collection label.
   */
  async enrichPortfolioRowsIfSparse(
    rows: AlchemyNftPortfolioRow[],
  ): Promise<AlchemyNftPortfolioRow[]> {
    const key = (r: AlchemyNftPortfolioRow) =>
      `${r.contractAddress.toLowerCase()}-${r.tokenId}`;

    const rowNeedsEnrich = (r: AlchemyNftPortfolioRow) =>
      !(
        Boolean(r.name?.trim()) &&
        Boolean(r.image?.trim()) &&
        Boolean(r.collectionName?.trim())
      );

    const toFetch: AlchemyNftPortfolioRow[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (!rowNeedsEnrich(r)) continue;
      const k = key(r);
      if (seen.has(k)) continue;
      seen.add(k);
      toFetch.push(r);
    }
    if (toFetch.length === 0) return rows;

    const enrichByKey = new Map<
      string,
      {
        name: string | null;
        image: string | null;
        collectionName: string | null;
      }
    >();

    const concurrency = 8;
    for (let i = 0; i < toFetch.length; i += concurrency) {
      const chunk = toFetch.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (r) => {
          const k = key(r);
          const extra = await this.fetchGetNFTMetadataEnrichment(
            r.contractAddress,
            r.tokenId,
            r.standard,
          );
          enrichByKey.set(k, extra);
        }),
      );
    }

    return rows.map((r) => {
      const k = key(r);
      const extra = enrichByKey.get(k);
      if (!extra) return r;
      const name = r.name?.trim() ? r.name : (extra.name ?? r.name);
      const image = r.image?.trim() ? r.image : (extra.image ?? r.image);
      const collectionName = r.collectionName?.trim()
        ? r.collectionName
        : (extra.collectionName ?? r.collectionName);
      return { ...r, name, image, collectionName };
    });
  }

  /**
   * Non-zero ERC-20 balances for an owner via `alchemy_getTokenBalances` (`erc20` set).
   */
  async getErc20Balances(
    owner: Address,
  ): Promise<{ contractAddress: Address; balanceRaw: bigint }[]> {
    const result = await this.postJsonRpc<AlchemyTokenBalancesResult>(
      "alchemy_getTokenBalances",
      [owner, "erc20"],
    );

    const out: { contractAddress: Address; balanceRaw: bigint }[] = [];
    for (const row of result.tokenBalances) {
      if (row.error || !row.tokenBalance) continue;
      const hex = row.tokenBalance;
      if (hex === "0x" || hex === "0x0") continue;
      let bal: bigint;
      try {
        bal = BigInt(hex);
      } catch {
        continue;
      }
      if (bal === BigInt(0)) continue;
      if (
        typeof row.contractAddress !== "string" ||
        !row.contractAddress.startsWith("0x")
      ) {
        continue;
      }
      out.push({
        contractAddress: getAddress(row.contractAddress),
        balanceRaw: bal,
      });
    }
    return out;
  }

  async getCryptournsSupply(): Promise<number> {
    const url = new URL(
      `https://${this.host}/nft/v3/${this.apiKey}/getContractMetadata`,
    );
    url.searchParams.set("contractAddress", CRYPTOURNS_CONTRACT.address);

    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Alchemy getNFTsForCollection failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as { totalSupply: string | undefined };

    if (!data.totalSupply) {
      throw new Error("Total supply not found");
    }

    return Number(data.totalSupply);
  }

  private async postJsonRpc<TResult>(
    method: string,
    params: unknown[],
  ): Promise<TResult> {
    const url = `https://${this.host}/v2/${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Alchemy ${method} failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    const json = (await res.json()) as {
      result?: TResult;
      error?: { message?: string };
    };

    if (json.error?.message) {
      throw new Error(`Alchemy ${method}: ${json.error.message}`);
    }
    if (json.result === undefined) {
      throw new Error(`Alchemy ${method}: missing result`);
    }

    return json.result;
  }

  /**
   * Mint tx and first owner for this token id via `alchemy_getAssetTransfers` (Alchemy free tier caps
   * `eth_getLogs` to a 10-block window). Uses ERC-721 mint `Transfer` from `address(0)` — `mintedBy`
   * is the transfer `to` (first owner), not necessarily `tx.origin`.
   */
  async getCryptournMintDetails(
    urnId: number,
  ): Promise<{ mintTx: string; mintedBy: string; mintedAt: Date } | null> {
    const contractLower = CRYPTOURNS_CONTRACT.address.toLowerCase();
    const id = BigInt(urnId);

    type AlchemyAssetTransfer = {
      hash: string;
      blockNum: string;
      from: string;
      to?: string | null;
      category: string;
      erc721TokenId?: string | null;
      tokenId?: string | null;
      rawContract?: { address?: string | null };
      metadata?: { blockTimestamp?: string };
    };

    type TransfersPage = {
      transfers: AlchemyAssetTransfer[];
      pageKey?: string;
    };

    let pageKey: string | undefined;

    const matchesMint = (t: AlchemyAssetTransfer): boolean => {
      if (t.category !== "erc721") return false;
      const rawAddr = t.rawContract?.address?.toLowerCase();
      if (rawAddr && rawAddr !== contractLower) return false;
      if ((t.from ?? "").toLowerCase() !== ZERO_ADDRESS.toLowerCase())
        return false;
      const tid = t.tokenId ?? t.erc721TokenId;
      if (tid == null || tid === "") return false;
      try {
        return BigInt(tid) === id;
      } catch {
        return false;
      }
    };

    let mint: AlchemyAssetTransfer | undefined;

    do {
      const params: Record<string, unknown> = {
        fromBlock: "0x0",
        toBlock: "latest",
        fromAddress: ZERO_ADDRESS,
        contractAddresses: [CRYPTOURNS_CONTRACT.address],
        category: ["erc721"],
        excludeZeroValue: false,
        order: "asc",
        withMetadata: true,
        maxCount: "0x3e8",
      };
      if (pageKey) params.pageKey = pageKey;

      const result = await this.postJsonRpc<TransfersPage>(
        "alchemy_getAssetTransfers",
        [params],
      );

      mint = result.transfers.find(matchesMint);
      if (mint) break;

      const next = result.pageKey?.trim();
      pageKey = next && next.length > 0 ? next : undefined;
    } while (pageKey);

    if (!mint) return null;

    const firstOwner = mint.to;
    if (
      typeof firstOwner !== "string" ||
      !firstOwner.startsWith("0x") ||
      firstOwner.length !== 42
    ) {
      return null;
    }

    type EthBlock = { timestamp: string };

    let mintedAt: Date | undefined;
    const iso = mint.metadata?.blockTimestamp;
    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) mintedAt = d;
    }
    if (!mintedAt) {
      const block = await this.postJsonRpc<EthBlock | null>(
        "eth_getBlockByNumber",
        [mint.blockNum, false],
      );
      if (!block?.timestamp) return null;
      mintedAt = new Date(Number.parseInt(block.timestamp, 16) * 1000);
    }

    return {
      mintTx: mint.hash,
      mintedBy: firstOwner,
      mintedAt,
    };
  }

  /** Any historical ERC-20 / NFT send from this address (e.g. TBA) indicates the urn was emptied. */
  async hasOutboundAssetTransfers(fromAddress: string): Promise<boolean> {
    type TransfersPage = { transfers: unknown[]; pageKey?: string };
    const result = await this.postJsonRpc<TransfersPage>(
      "alchemy_getAssetTransfers",
      [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress,
          category: ["erc20", "erc721", "erc1155"],
          excludeZeroValue: false,
          maxCount: "0x1",
        },
      ],
    );
    return result.transfers.length > 0;
  }
}
