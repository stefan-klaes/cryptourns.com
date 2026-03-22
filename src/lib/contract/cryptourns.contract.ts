import { sepolia } from "viem/chains";
import { abi } from "./abi";

export const CRYPTOURNS_CONTRACT = {
  address: "0xcC51e8EdbcABB3fB3Bf4967DAb957BCE4257f6f8",
  abi,
  chainId: sepolia.id,
} as const;
