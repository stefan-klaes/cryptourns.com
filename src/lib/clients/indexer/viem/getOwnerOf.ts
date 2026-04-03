import { getCryptournsPublicClient } from "@/lib/clients/rpc/cryptournsPublicClient";
import { CRYPTOURNS_CONTRACT } from "@/lib/contract/cryptourns.contract";
import type { Address } from "viem";
import { getAddress } from "viem";

export async function getOwnerOfViem(urnId: number): Promise<Address> {
  const client = getCryptournsPublicClient();
  const ownerRaw = await client.readContract({
    address: CRYPTOURNS_CONTRACT.address,
    abi: CRYPTOURNS_CONTRACT.abi,
    functionName: "ownerOf",
    args: [BigInt(urnId)],
  });
  return getAddress(ownerRaw);
}
