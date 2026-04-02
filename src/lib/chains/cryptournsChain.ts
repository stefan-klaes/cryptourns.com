import type { Chain } from "wagmi/chains";
import { mainnet, sepolia } from "wagmi/chains";

export type CryptournsChainConfig = {
  isMainnet: boolean;
  chain: Chain;
  chainId: number;
  name: string;
  /** Etherscan (or chain default) base URL, no trailing slash */
  explorerBaseUrl: string;
};

/**
 * `NEXT_PUBLIC_IS_MAINNET === "true"` → Ethereum mainnet; otherwise Sepolia.
 * Available on server and client (inlined at build for client).
 */
export function isCryptournsMainnet(): boolean {
  return process.env.NEXT_PUBLIC_IS_MAINNET === "true";
}

export function getCryptournsChainConfig(): CryptournsChainConfig {
  const isMainnet = isCryptournsMainnet();
  const chain = isMainnet ? mainnet : sepolia;
  const explorer = chain.blockExplorers?.default?.url;
  if (!explorer) {
    throw new Error(`Missing block explorer URL for chain ${chain.id}`);
  }
  return {
    isMainnet,
    chain,
    chainId: chain.id,
    name: chain.name,
    explorerBaseUrl: explorer,
  };
}
