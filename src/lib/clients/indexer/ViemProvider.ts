import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { Address, PublicClient } from "viem";
import { createPublicClient, getAddress, http } from "viem";
import { mainnet, sepolia } from "viem/chains";

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
  const isMainnet = Boolean(process.env.isMainnet);
  return createPublicClient({
    chain: isMainnet ? mainnet : sepolia,
    transport: http(rpcUrl(isMainnet)),
  });
}
