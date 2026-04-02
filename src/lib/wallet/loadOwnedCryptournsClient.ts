import { fetchOwnedCryptourns } from "@/lib/wallet/fetchOwnedCryptournsAction";
import type { OwnedCryptournsResponse } from "@/lib/wallet/portfolioTypes";

export async function loadOwnedCryptournsClient(
  address: string,
): Promise<OwnedCryptournsResponse> {
  const result = await fetchOwnedCryptourns(address);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
}
