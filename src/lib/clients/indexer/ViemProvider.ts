import { getCryptournsPublicClient } from "@/lib/clients/rpc/cryptournsPublicClient";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { Address, PublicClient } from "viem";
import { getAddress } from "viem";

export class ViemProvider {
  readonly name = "Viem" as const;

  private readonly client: PublicClient;

  constructor() {
    this.client = getCryptournsPublicClient();
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
