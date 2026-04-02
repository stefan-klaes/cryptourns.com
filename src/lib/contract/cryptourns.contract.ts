import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";

import { abi } from "./abi";

const SEPOLIA_DEFAULT_ADDRESS =
  "0xcC51e8EdbcABB3fB3Bf4967DAb957BCE4257f6f8" as const;

function resolveCryptournsContractAddress(isMainnet: boolean): `0x${string}` {
  const fromEnv = process.env.NEXT_PUBLIC_CRYPTOURNS_CONTRACT_ADDRESS;
  if (
    typeof fromEnv === "string" &&
    fromEnv.startsWith("0x") &&
    fromEnv.length === 42
  ) {
    return fromEnv as `0x${string}`;
  }
  if (!isMainnet) {
    return SEPOLIA_DEFAULT_ADDRESS;
  }
  throw new Error(
    "NEXT_PUBLIC_CRYPTOURNS_CONTRACT_ADDRESS is required when NEXT_PUBLIC_IS_MAINNET is true",
  );
}

const { chainId, isMainnet } = getCryptournsChainConfig();

export const CRYPTOURNS_CONTRACT = {
  address: resolveCryptournsContractAddress(isMainnet),
  abi,
  chainId,
} as const;
