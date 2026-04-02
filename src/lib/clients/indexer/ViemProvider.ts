import { getCryptournsChainConfig } from "@/lib/chains/cryptournsChain";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { Address, PublicClient } from "viem";
import { createPublicClient, getAddress, http } from "viem";

export class ViemProvider {
  readonly name = "Viem" as const;

  private readonly client: PublicClient;

  constructor() {
    this.client = createCryptournsPublicClient();
  }

  async getTokenboundAccount(urnId: number): Promise<Address> {
    const tbaRaw = await this.client.readContract({
      address: CRYPTOURNS_CONTRACT.address,
      abi: CRYPTOURNS_CONTRACT.abi,
      functionName: "showTokenboundAccount",
      args: [BigInt(urnId)],
    });
    return getAddress(tbaRaw);
  }

  async getOwnerOf(urnId: number): Promise<Address> {
    const ownerRaw = await this.client.readContract({
      address: CRYPTOURNS_CONTRACT.address,
      abi: CRYPTOURNS_CONTRACT.abi,
      functionName: "ownerOf",
      args: [BigInt(urnId)],
    });
    return getAddress(ownerRaw);
  }
}

function rpcUrl(isMainnet: boolean): string {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key)
    throw new Error("Missing ETHEREUM_RPC_URL or ALCHEMY_API_KEY for RPC");
  return isMainnet
    ? `https://eth-mainnet.g.alchemy.com/v2/${key}`
    : `https://eth-sepolia.g.alchemy.com/v2/${key}`;
}

function createCryptournsPublicClient(): PublicClient {
  const { chain, isMainnet } = getCryptournsChainConfig();
  return createPublicClient({
    chain,
    transport: http(rpcUrl(isMainnet)),
  });
}
