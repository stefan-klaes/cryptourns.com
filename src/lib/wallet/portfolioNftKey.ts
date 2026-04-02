import type { NftPortfolioItemJson } from "@/lib/wallet/portfolioTypes";
import { type Address, getAddress } from "viem";

/** Stable key for portfolio NFT rows (lowercase contract + decimal token id). */
export function portfolioNftKey(nft: NftPortfolioItemJson): string {
  return portfolioNftKeyFromParts(nft.contractAddress, nft.tokenId);
}

export function portfolioNftKeyFromParts(
  contractAddress: Address,
  tokenId: string,
): string {
  const addr = getAddress(contractAddress).toLowerCase();
  try {
    return `${addr}-${BigInt(tokenId).toString()}`;
  } catch {
    return `${addr}-${tokenId}`;
  }
}
