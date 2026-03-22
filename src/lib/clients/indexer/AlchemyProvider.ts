import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import { AssetType } from "@/generated/prisma";
import type { Asset } from "./Asset";

type RawAlchemyOwnedNft = {
  contract?: { address?: string };
  id?: { tokenId?: string };
  tokenType?: string;
  balance?: string;
};

export type AlchemyGetNftsResponse = {
  ownedNfts: RawAlchemyOwnedNft[];
  totalCount?: number;
  pageKey?: string;
  blockHash?: string;
};

/** Parsed JSON from Alchemy `getNFTsForCollection`. */
export type AlchemyGetNftsForCollectionResponse = Record<string, unknown>;

function parseOwnedNft(raw: RawAlchemyOwnedNft): Asset | null {
  const addr = raw.contract?.address;
  if (typeof addr !== "string" || !addr.startsWith("0x")) return null;

  const tt = raw.tokenType;
  if (tt !== "ERC721" && tt !== "ERC1155") return null;

  const tokenId = raw.id?.tokenId;
  if (typeof tokenId !== "string" || tokenId.length === 0) return null;

  const contractAddress = addr.toLowerCase();
  let quantity = 1;
  if (tt === "ERC1155" && typeof raw.balance === "string") {
    const n = Number.parseInt(raw.balance, 10);
    if (!Number.isNaN(n) && n > 0) quantity = n;
  }

  return {
    contractAddress,
    tokenId,
    type: tt === "ERC721" ? AssetType.ERC721 : AssetType.ERC1155,
    quantity,
  };
}

export class AlchemyProvider {
  private readonly apiKey: string;
  private readonly host: string;

  constructor() {
    const key = process.env.ALCHEMY_API_KEY;
    if (!key) {
      throw new Error("Missing ALCHEMY_API_KEY");
    }
    this.apiKey = key;
    this.host = process.env.isMainnet
      ? "eth-mainnet.g.alchemy.com"
      : "eth-sepolia.g.alchemy.com";
  }

  private async fetchNftsPage(
    owner: string,
    pageKey?: string,
  ): Promise<AlchemyGetNftsResponse> {
    const url = new URL(`https://${this.host}/nft/v2/${this.apiKey}/getNFTs`);
    url.searchParams.set("owner", owner);
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("withMetadata", "false");
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

  async getNfts(owner: string): Promise<AlchemyGetNftsResponse> {
    return this.fetchNftsPage(owner);
  }

  async getAllNftsForOwner(owner: string): Promise<Asset[]> {
    const out: Asset[] = [];
    let pageKey: string | undefined;
    do {
      const res = await this.fetchNftsPage(owner, pageKey);
      for (const raw of res.ownedNfts) {
        const parsed = parseOwnedNft(raw);
        if (parsed) out.push(parsed);
      }
      pageKey = res.pageKey;
    } while (pageKey);
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
}
