import { AssetType } from "@/generated/prisma";
import { getAddress, isAddress, type Address } from "viem";
import type { AlchemyNftPortfolioRow } from "./alchemyNftPortfolio";
import { getConfig } from "./client";
import { extractDisplayFromGetNFTMetadataResponse } from "./parseAlchemyNft";

async function fetchGetNFTMetadataEnrichment(
  contractAddress: Address,
  tokenId: string,
  standard: "ERC721" | "ERC1155",
): Promise<{
  name: string | null;
  image: string | null;
  collectionName: string | null;
}> {
  const { key, host } = getConfig();
  const url = new URL(`https://${host}/nft/v2/${key}/getNFTMetadata`);
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

export async function getNftMetadataDisplayAlchemy(
  contractAddress: string,
  tokenId: string,
  type: AssetType,
): Promise<{
  name: string | null;
  image: string | null;
  collectionName: string | null;
}> {
  if (!isAddress(contractAddress)) {
    return { name: null, image: null, collectionName: null };
  }
  if (type !== AssetType.ERC721 && type !== AssetType.ERC1155) {
    return { name: null, image: null, collectionName: null };
  }
  const standard = type === AssetType.ERC721 ? "ERC721" : "ERC1155";
  return fetchGetNFTMetadataEnrichment(
    getAddress(contractAddress),
    tokenId,
    standard,
  );
}

/**
 * Fetches `getNFTMetadata` for rows missing any of name, image, or collection label.
 */
export async function enrichPortfolioRowsIfSparse(
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
        const extra = await fetchGetNFTMetadataEnrichment(
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
