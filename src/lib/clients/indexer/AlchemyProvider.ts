import { AssetType } from "@/generated/prisma";
import { ZERO_ADDRESS } from "@/lib/constants/zeroAddress";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
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

export function parseAlchemyOwnedNft(raw: RawAlchemyOwnedNft): Asset | null {
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
  readonly name = "Alchemy" as const;

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

  async getNfts(owner: string, _pageKey?: string): Promise<Asset[]> {
    const out: Asset[] = [];
    let pageKey: string | undefined;
    do {
      const res = await this.fetchNftsPage(owner, pageKey);
      for (const raw of res.ownedNfts) {
        const parsed = parseAlchemyOwnedNft(raw);
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
