import { isCryptournsMainnet } from "@/lib/chains/cryptournsChain";
import { getAddress, type Address } from "viem";
import type { AlchemyGetNftsResponse } from "./parseAlchemyNft";

export function getConfig() {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) throw new Error("Missing ALCHEMY_API_KEY");
  const host = isCryptournsMainnet()
    ? "eth-mainnet.g.alchemy.com"
    : "eth-sepolia.g.alchemy.com";
  return { key, host };
}

export async function postJsonRpc<TResult>(
  method: string,
  params: unknown[],
): Promise<TResult> {
  const { key, host } = getConfig();
  const url = `https://${host}/v2/${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
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

export async function fetchNftsPage(
  owner: string,
  pageKey: string | undefined,
  withMetadata: boolean,
  options?: {
    includeSpam?: boolean;
    contractAddresses?: Address[];
    orderByTransferTime?: boolean;
  },
): Promise<AlchemyGetNftsResponse> {
  const { key, host } = getConfig();
  const url = new URL(`https://${host}/nft/v2/${key}/getNFTs`);
  url.searchParams.set("owner", owner);
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("withMetadata", withMetadata ? "true" : "false");
  if (options?.orderByTransferTime) {
    url.searchParams.set("orderBy", "transferTime");
  }
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
