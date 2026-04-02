import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { createPublicClient, http, type PublicClient } from "viem";

function rpcUrl(isMainnet: boolean): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) {
    throw new Error("Missing ALCHEMY_API_KEY for RPC");
  }
  return isMainnet
    ? `https://eth-mainnet.g.alchemy.com/v2/${key}`
    : `https://eth-sepolia.g.alchemy.com/v2/${key}`;
}

let cached: PublicClient | null = null;

/** Shared read client for Cryptourns chain (mainnet / Sepolia from env). */
export function getCryptournsPublicClient(): PublicClient {
  if (cached) return cached;
  const { chain, isMainnet } = getCryptournsChainConfig();
  cached = createPublicClient({
    chain,
    transport: http(rpcUrl(isMainnet)),
  });
  return cached;
}
