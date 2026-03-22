import type { Address, PublicClient } from "viem";
import { createPublicClient, getAddress, http } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { CRYPTOURNS_CONTRACT } from "./cryptourns.contract";

export class ViemProvider {
  private readonly client: PublicClient;

  constructor() {
    const isMainnet = Boolean(process.env.isMainnet);
    this.client = createPublicClient({
      chain: isMainnet ? mainnet : sepolia,
      transport: http(rpcUrl(isMainnet)),
    });
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
