/**
 * Incremental Alchemy `alchemy_getAssetTransfers` ingest for urn TBAs.
 *
 * Idempotency: `createMany({ skipDuplicates: true })` relies on
 * `@@unique([urnId, txHash, logIndex, contractAddress, tokenId, direction])`.
 * Chain reorgs can rarely invalidate the tail of history; acceptable for this
 * app unless you add a periodic tail re-scan of the last N blocks.
 */
import {
  AssetTransferDirection,
  AssetType,
  Prisma,
} from "@/generated/prisma";
import { postJsonRpc } from "@/lib/clients/indexer/alchemy/client";
import { getNftMetadataDisplayAlchemy } from "@/lib/clients/indexer/alchemy/nftMetadata";
import { coerceAlchemyImageUrl } from "@/lib/clients/indexer/alchemy/parseAlchemyNft";
import { resolveTransferBlockTime } from "@/lib/clients/indexer/alchemy/resolveTransferBlockTime";
import { formatUnits, getAddress, type Address } from "viem";

const MAX_TRANSFER_PAGES = 100;
const MAX_NFT_ENRICH_KEYS = 280;
const CREATE_MANY_CHUNK = 400;

type RawAlchemyTransfer = {
  uniqueId?: string;
  hash: string;
  blockNum: string;
  from?: string | null;
  to?: string | null;
  category: string;
  value?: number | string | null;
  asset?: string | null;
  erc721TokenId?: string | null;
  tokenId?: string | null;
  erc1155Metadata?: Array<{
    tokenId?: string | null;
    value?: string | null;
  }> | null;
  rawContract?: {
    address?: string | null;
    value?: string | null;
    decimal?: string | number | null;
  };
  metadata?: Record<string, unknown>;
  logIndex?: string | number | null;
};

type TransfersPage = {
  transfers: RawAlchemyTransfer[];
  pageKey?: string;
};

export type DraftUrnAssetTransfer = {
  direction: AssetTransferDirection;
  assetType: AssetType;
  blockNumber: number;
  occurredAt: Date | null;
  txHash: string;
  logIndex: number;
  fromAddress: string;
  toAddress: string;
  contractAddress: string;
  tokenId: string;
  quantityRaw: string;
  quantityDisplay: string | null;
  assetSymbol: string | null;
  decimals: number | null;
  name: string | null;
  imageUrl: string | null;
  collectionName: string | null;
  alchemyUniqueId: string | null;
};

function parseBlockNumberHex(blockNum: string): number {
  return Number.parseInt(blockNum, 16);
}

function parseLogIndex(t: RawAlchemyTransfer): number {
  const li = t.logIndex;
  if (typeof li === "number" && Number.isInteger(li) && li >= 0) return li;
  if (typeof li === "string" && li.startsWith("0x")) {
    const n = Number.parseInt(li, 16);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  if (typeof li === "string" && /^\d+$/.test(li)) {
    const n = Number.parseInt(li, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return 0;
}

function canonTokenId(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).length === 0) return null;
  try {
    return BigInt(String(raw)).toString();
  } catch {
    return null;
  }
}

function mapCategoryToAssetType(category: string): AssetType | null {
  const c = category.toLowerCase();
  if (c === "erc20") return AssetType.ERC20;
  if (c === "erc721") return AssetType.ERC721;
  if (c === "erc1155") return AssetType.ERC1155;
  return null;
}

function erc20Decimals(t: RawAlchemyTransfer): number {
  const decRaw = t.rawContract?.decimal;
  if (typeof decRaw === "number" && Number.isFinite(decRaw) && decRaw >= 0) {
    return Math.min(Math.floor(decRaw), 36);
  }
  if (typeof decRaw === "string" && /^\d+$/.test(decRaw)) {
    const n = Number.parseInt(decRaw, 10);
    if (Number.isFinite(n) && n >= 0) return Math.min(n, 36);
  }
  return 18;
}

function erc20QuantityRawAndDisplay(t: RawAlchemyTransfer): {
  quantityRaw: string;
  quantityDisplay: string;
  decimals: number | null;
} {
  const decimals = erc20Decimals(t);
  const rawVal = t.rawContract?.value;
  if (typeof rawVal === "string" && rawVal.startsWith("0x")) {
    try {
      const bi = BigInt(rawVal);
      return {
        quantityRaw: bi.toString(),
        quantityDisplay: formatUnits(bi, decimals),
        decimals,
      };
    } catch {
      /* fall through */
    }
  }
  if (typeof t.value === "number" && Number.isFinite(t.value)) {
    return {
      quantityRaw: String(t.value),
      quantityDisplay: String(t.value),
      decimals,
    };
  }
  if (typeof t.value === "string" && t.value.trim().length > 0) {
    return {
      quantityRaw: t.value.trim(),
      quantityDisplay: t.value.trim(),
      decimals,
    };
  }
  return { quantityRaw: "0", quantityDisplay: "—", decimals };
}

function pickNftFieldsFromTransferMeta(
  meta: Record<string, unknown> | undefined,
): { name: string | null; imageUrl: string | null; collectionName: string | null } {
  if (!meta) {
    return { name: null, imageUrl: null, collectionName: null };
  }
  const nameRaw =
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.title === "string" && meta.title.trim()) ||
    null;
  const imageUrl = coerceAlchemyImageUrl(meta.image);
  const collectionName =
    typeof meta.collectionName === "string" && meta.collectionName.trim()
      ? meta.collectionName.trim()
      : null;
  return { name: nameRaw, imageUrl, collectionName };
}

async function rawTransferToDrafts(
  t: RawAlchemyTransfer,
  tbaLower: string,
  direction: AssetTransferDirection,
  blockCache: Map<string, Date>,
): Promise<DraftUrnAssetTransfer[]> {
  if (!t.blockNum) return [];

  const fromL = (t.from ?? "").toLowerCase();
  const toL = (t.to ?? "").toLowerCase();
  if (direction === AssetTransferDirection.IN && toL !== tbaLower) return [];
  if (direction === AssetTransferDirection.OUT && fromL !== tbaLower) return [];

  const blockNumber = parseBlockNumberHex(t.blockNum);
  const logIndex = parseLogIndex(t);
  const txHash = (typeof t.hash === "string" ? t.hash : "").toLowerCase();
  const fromAddress =
    typeof t.from === "string" && t.from.startsWith("0x")
      ? t.from.toLowerCase()
      : "0x0000000000000000000000000000000000000000";
  const toAddr =
    typeof t.to === "string" && t.to.startsWith("0x")
      ? t.to.toLowerCase()
      : "0x0000000000000000000000000000000000000000";

  const occurredAt = await resolveTransferBlockTime(
    t.blockNum,
    t.metadata as { blockTimestamp?: string } | undefined,
    blockCache,
  );

  const alchemyUniqueId =
    typeof t.uniqueId === "string" && t.uniqueId.length > 0 ? t.uniqueId : null;

  const cat = (t.category ?? "").toLowerCase();
  const assetType = mapCategoryToAssetType(cat);
  if (!assetType) return [];

  const contractRaw = t.rawContract?.address;
  if (typeof contractRaw !== "string" || !contractRaw.startsWith("0x")) {
    return [];
  }
  const contractAddress = contractRaw.toLowerCase();

  const base = (): Omit<
    DraftUrnAssetTransfer,
    | "assetType"
    | "tokenId"
    | "quantityRaw"
    | "quantityDisplay"
    | "assetSymbol"
    | "decimals"
    | "name"
    | "imageUrl"
    | "collectionName"
    | "alchemyUniqueId"
  > => ({
    direction,
    blockNumber,
    occurredAt,
    txHash,
    logIndex,
    fromAddress,
    toAddress: toAddr,
    contractAddress,
  });

  if (cat === "erc20") {
    const { quantityRaw, quantityDisplay, decimals } = erc20QuantityRawAndDisplay(t);
    const sym =
      typeof t.asset === "string" && t.asset.trim() ? t.asset.trim() : null;
    return [
      {
        ...base(),
        assetType: AssetType.ERC20,
        tokenId: "0",
        quantityRaw,
        quantityDisplay,
        assetSymbol: sym,
        decimals,
        name: sym,
        imageUrl: null,
        collectionName: null,
        alchemyUniqueId,
      },
    ];
  }

  const metaPick = pickNftFieldsFromTransferMeta(t.metadata);

  if (cat === "erc721") {
    const tid = canonTokenId(t.tokenId ?? t.erc721TokenId);
    if (!tid) return [];
    return [
      {
        ...base(),
        assetType: AssetType.ERC721,
        tokenId: tid,
        quantityRaw: "1",
        quantityDisplay: "1",
        assetSymbol: null,
        decimals: null,
        name: metaPick.name,
        imageUrl: metaPick.imageUrl,
        collectionName: metaPick.collectionName,
        alchemyUniqueId,
      },
    ];
  }

  if (cat === "erc1155") {
    const metaList = t.erc1155Metadata;
    if (Array.isArray(metaList) && metaList.length > 0) {
      return metaList.flatMap((entry) => {
        const tid = canonTokenId(entry?.tokenId);
        if (!tid) return [];
        let qty = "1";
        if (typeof entry?.value === "string" && /^\d+$/.test(entry.value)) {
          try {
            qty = BigInt(entry.value).toString();
          } catch {
            qty = entry.value;
          }
        }
        return [
          {
            ...base(),
            assetType: AssetType.ERC1155,
            tokenId: tid,
            quantityRaw: qty,
            quantityDisplay: qty,
            assetSymbol: null,
            decimals: null,
            name: metaPick.name,
            imageUrl: metaPick.imageUrl,
            collectionName: metaPick.collectionName,
            alchemyUniqueId: null,
          },
        ];
      });
    }
    const tid = canonTokenId(t.tokenId);
    if (!tid) return [];
    return [
      {
        ...base(),
        assetType: AssetType.ERC1155,
        tokenId: tid,
        quantityRaw: "1",
        quantityDisplay: "1",
        assetSymbol: null,
        decimals: null,
        name: metaPick.name,
        imageUrl: metaPick.imageUrl,
        collectionName: metaPick.collectionName,
        alchemyUniqueId,
      },
    ];
  }

  return [];
}

async function fetchDirectionPages(
  tba: Address,
  direction: AssetTransferDirection,
  fromBlockHex: string,
  blockCache: Map<string, Date>,
): Promise<DraftUrnAssetTransfer[]> {
  const tbaLower = tba.toLowerCase();
  const out: DraftUrnAssetTransfer[] = [];
  let pageKey: string | undefined;
  let pages = 0;

  do {
    pages += 1;
    if (pages > MAX_TRANSFER_PAGES) {
      console.warn(
        `[Alchemy] asset transfer sync capped at ${MAX_TRANSFER_PAGES} pages (${direction}) for ${tba}`,
      );
      break;
    }

    const params: Record<string, unknown> = {
      fromBlock: fromBlockHex,
      toBlock: "latest",
      category: ["erc20", "erc721", "erc1155"],
      excludeZeroValue: false,
      order: "asc",
      withMetadata: true,
      maxCount: "0x3e8",
    };
    if (direction === AssetTransferDirection.IN) {
      params.toAddress = getAddress(tba);
    } else {
      params.fromAddress = getAddress(tba);
    }
    if (pageKey) params.pageKey = pageKey;

    const result = await postJsonRpc<TransfersPage>(
      "alchemy_getAssetTransfers",
      [params],
    );

    const nested = await Promise.all(
      result.transfers.map((t) =>
        rawTransferToDrafts(t, tbaLower, direction, blockCache),
      ),
    );
    for (const rows of nested) out.push(...rows);

    const next = result.pageKey?.trim();
    pageKey = next && next.length > 0 ? next : undefined;
  } while (pageKey);

  return out;
}

async function getLatestBlockNumber(): Promise<number> {
  const hex = await postJsonRpc<string>("eth_blockNumber", []);
  return Number.parseInt(hex, 16);
}

function draftKeyForEnrich(d: DraftUrnAssetTransfer): string {
  return `${d.contractAddress}-${d.tokenId}-${d.assetType}`;
}

async function enrichSparseNftDrafts(
  drafts: DraftUrnAssetTransfer[],
): Promise<DraftUrnAssetTransfer[]> {
  const candidates: DraftUrnAssetTransfer[] = [];
  const seen = new Set<string>();
  for (const d of drafts) {
    if (d.assetType !== AssetType.ERC721 && d.assetType !== AssetType.ERC1155) {
      continue;
    }
    if (
      Boolean(d.name?.trim()) &&
      Boolean(d.imageUrl?.trim()) &&
      Boolean(d.collectionName?.trim())
    ) {
      continue;
    }
    const k = draftKeyForEnrich(d);
    if (seen.has(k)) continue;
    seen.add(k);
    candidates.push(d);
    if (candidates.length >= MAX_NFT_ENRICH_KEYS) break;
  }

  const enrichByKey = new Map<
    string,
    { name: string | null; image: string | null; collectionName: string | null }
  >();

  const concurrency = 8;
  for (let i = 0; i < candidates.length; i += concurrency) {
    const chunk = candidates.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (d) => {
        const k = draftKeyForEnrich(d);
        const extra = await getNftMetadataDisplayAlchemy(
          d.contractAddress,
          d.tokenId,
          d.assetType,
        );
        enrichByKey.set(k, extra);
      }),
    );
  }

  return drafts.map((d) => {
    if (d.assetType !== AssetType.ERC721 && d.assetType !== AssetType.ERC1155) {
      return d;
    }
    const extra = enrichByKey.get(draftKeyForEnrich(d));
    if (!extra) return d;
    return {
      ...d,
      name: d.name?.trim() ? d.name : (extra.name ?? d.name),
      imageUrl: d.imageUrl?.trim() ? d.imageUrl : (extra.image ?? d.imageUrl),
      collectionName: d.collectionName?.trim()
        ? d.collectionName
        : (extra.collectionName ?? d.collectionName),
    };
  });
}

function draftToCreateManyInput(
  urnId: number,
  d: DraftUrnAssetTransfer,
): Prisma.UrnAssetTransferCreateManyInput {
  return {
    urnId,
    direction: d.direction,
    assetType: d.assetType,
    blockNumber: d.blockNumber,
    occurredAt: d.occurredAt,
    txHash: d.txHash,
    logIndex: d.logIndex,
    fromAddress: d.fromAddress,
    toAddress: d.toAddress,
    contractAddress: d.contractAddress,
    tokenId: d.tokenId,
    quantityRaw: d.quantityRaw,
    quantityDisplay: d.quantityDisplay,
    assetSymbol: d.assetSymbol,
    decimals: d.decimals,
    name: d.name,
    imageUrl: d.imageUrl,
    collectionName: d.collectionName,
    alchemyUniqueId: d.alchemyUniqueId,
  };
}

function fromBlockHexForWatermark(syncedThroughBlock: number): string {
  if (syncedThroughBlock <= 0) return "0x0";
  const next = syncedThroughBlock + 1;
  return `0x${next.toString(16)}`;
}

/**
 * Fetches new IN/OUT asset transfers from Alchemy since `syncedThroughBlock`, enriches sparse NFT metadata,
 * and returns rows ready for `createMany` + the next watermark (chain head if no new events).
 * Reorgs: inserts are idempotent via `@@unique` on `(urnId, txHash, logIndex, contractAddress, tokenId, direction)`.
 */
export async function loadNewUrnAssetTransfersForPersist(
  urnId: number,
  tba: Address,
  syncedThroughBlock: number,
): Promise<{
  rows: Prisma.UrnAssetTransferCreateManyInput[];
  nextWatermark: number;
}> {
  const fromBlock = fromBlockHexForWatermark(syncedThroughBlock);
  const fromBlockNum = Number.parseInt(fromBlock, 16);
  const latestBlock = await getLatestBlockNumber();

  if (fromBlockNum > latestBlock) {
    return {
      rows: [],
      nextWatermark: Math.min(syncedThroughBlock, latestBlock),
    };
  }

  const blockCache = new Map<string, Date>();

  const [inDrafts, outDrafts] = await Promise.all([
    fetchDirectionPages(tba, AssetTransferDirection.IN, fromBlock, blockCache),
    fetchDirectionPages(tba, AssetTransferDirection.OUT, fromBlock, blockCache),
  ]);

  const merged = [...inDrafts, ...outDrafts];
  const enriched = await enrichSparseNftDrafts(merged);

  const rows = enriched.map((d) => draftToCreateManyInput(urnId, d));

  let nextWatermark: number;
  if (rows.length > 0) {
    nextWatermark = Math.max(syncedThroughBlock, ...rows.map((r) => r.blockNumber));
  } else {
    nextWatermark = Math.max(syncedThroughBlock, latestBlock);
  }

  return { rows, nextWatermark };
}

export async function persistUrnAssetTransferRows(
  tx: Prisma.TransactionClient,
  rows: Prisma.UrnAssetTransferCreateManyInput[],
  nextWatermark: number,
  urnId: number,
): Promise<void> {
  for (let i = 0; i < rows.length; i += CREATE_MANY_CHUNK) {
    const chunk = rows.slice(i, i + CREATE_MANY_CHUNK);
    await tx.urnAssetTransfer.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  await tx.urn.update({
    where: { id: urnId },
    data: { assetTransfersSyncedThroughBlock: nextWatermark },
  });
}
