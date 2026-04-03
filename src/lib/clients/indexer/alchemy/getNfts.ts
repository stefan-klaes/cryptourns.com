import { AssetType } from "@/generated/prisma";
import { getAddress } from "viem";
import type { Asset } from "../Asset";
import type { AlchemyNftPortfolioRow } from "./alchemyNftPortfolio";
import { fetchNftsPage, postJsonRpc } from "./client";
import { enrichPortfolioRowsIfSparse } from "./nftMetadata";
import { parseAlchemyOwnedNftPortfolio } from "./parseAlchemyNft";
import { resolveTransferBlockTime } from "./resolveTransferBlockTime";

export async function getNftsAlchemy(owner: string): Promise<Asset[]> {
  const portfolio: AlchemyNftPortfolioRow[] = [];
  let pageKey: string | undefined;
  do {
    const res = await fetchNftsPage(owner, pageKey, true, {
      orderByTransferTime: true,
    });
    for (const raw of res.ownedNfts) {
      const parsed = parseAlchemyOwnedNftPortfolio(raw);
      if (parsed) portfolio.push(parsed);
    }
    pageKey = res.pageKey;
  } while (pageKey);

  const rows = await enrichPortfolioRowsIfSparse(portfolio);

  const inboundByKey =
    await fetchLatestInboundNftTimestampsByAssetKey(owner);

  return rows.map((r) => {
    const key = `${r.contractAddress.toLowerCase()}-${r.tokenId}`;
    const sentToUrn = inboundByKey.get(key) ?? r.sentToUrn;
    return {
      contractAddress: r.contractAddress.toLowerCase(),
      tokenId: r.tokenId,
      type: r.standard === "ERC721" ? AssetType.ERC721 : AssetType.ERC1155,
      quantity: r.quantity,
      name: r.name,
      imageUrl: r.image,
      collectionName: r.collectionName,
      sentToUrn,
    };
  });
}

/**
 * Latest inbound ERC-721 / ERC-1155 transfer time per `(contract, tokenId)` for `toAddress === tba`.
 * Used when NFT `getNFTs` omits `acquiredAt` (common on v2 / testnets).
 */
async function fetchLatestInboundNftTimestampsByAssetKey(
  tba: string,
): Promise<Map<string, Date>> {
  const tbaLower = tba.toLowerCase();
  type AssetTransfer = {
    blockNum: string;
    to?: string | null;
    category: string;
    erc721TokenId?: string | null;
    tokenId?: string | null;
    rawContract?: { address?: string | null };
    metadata?: { blockTimestamp?: string };
  };
  type TransfersPage = {
    transfers: AssetTransfer[];
    pageKey?: string;
  };

  const map = new Map<string, Date>();
  const blockCache = new Map<string, Date>();
  let pageKey: string | undefined;
  let pages = 0;
  const maxPages = 100;

  do {
    pages += 1;
    if (pages > maxPages) {
      console.warn(
        `[Alchemy] inbound NFT transfer scan capped at ${maxPages} pages for ${tba}`,
      );
      break;
    }

    const params: Record<string, unknown> = {
      fromBlock: "0x0",
      toBlock: "latest",
      toAddress: getAddress(tba),
      category: ["erc721", "erc1155"],
      excludeZeroValue: false,
      order: "asc",
      withMetadata: true,
      maxCount: "0x3e8",
    };
    if (pageKey) params.pageKey = pageKey;

    const result = await postJsonRpc<TransfersPage>(
      "alchemy_getAssetTransfers",
      [params],
    );

    for (const t of result.transfers) {
      if (!t.blockNum) continue;
      const cat = (t.category ?? "").toLowerCase();
      if (cat !== "erc721" && cat !== "erc1155") continue;
      if ((t.to ?? "").toLowerCase() !== tbaLower) continue;

      const addr = t.rawContract?.address;
      if (typeof addr !== "string" || !addr.startsWith("0x")) continue;
      const contractLower = addr.toLowerCase();

      const tidRaw = t.tokenId ?? t.erc721TokenId;
      if (tidRaw == null || String(tidRaw).length === 0) continue;
      let tokenCanon: string;
      try {
        tokenCanon = BigInt(String(tidRaw)).toString();
      } catch {
        continue;
      }

      const key = `${contractLower}-${tokenCanon}`;
      const d = await resolveTransferBlockTime(
        t.blockNum,
        t.metadata,
        blockCache,
      );
      if (d) map.set(key, d);
    }

    const next = result.pageKey?.trim();
    pageKey = next && next.length > 0 ? next : undefined;
  } while (pageKey);

  return map;
}
