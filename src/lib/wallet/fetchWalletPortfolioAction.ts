"use server";

import { getWalletPortfolio } from "@/lib/wallet/getWalletPortfolio";
import { parsePortfolioAddress } from "@/lib/wallet/parsePortfolioAddress";
import type { WalletPortfolioResponse } from "@/lib/wallet/portfolioTypes";

export type FetchWalletPortfolioResult =
  | { ok: true; data: WalletPortfolioResponse }
  | { ok: false; error: string };

/**
 * Full wallet portfolio: all NFTs (Alchemy owner index + Cryptourns merge) and ERC-20s.
 * For owned-urn lists only, use `fetchOwnedCryptourns` (contract-scoped; cheaper).
 */
export async function fetchWalletPortfolio(
  address: string,
): Promise<FetchWalletPortfolioResult> {
  const parsed = parsePortfolioAddress(address);
  if (!parsed) {
    return { ok: false, error: "Invalid wallet address." };
  }

  try {
    const data = await getWalletPortfolio(parsed);
    return { ok: true, data };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load wallet assets.";
    return { ok: false, error: message };
  }
}
