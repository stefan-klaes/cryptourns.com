"use server";

import { getOwnedCryptournsForWallet } from "@/lib/wallet/getOwnedCryptournsForWallet";
import { parsePortfolioAddress } from "@/lib/wallet/parsePortfolioAddress";
import type { OwnedCryptournsResponse } from "@/lib/wallet/portfolioTypes";

export type FetchOwnedCryptournsResult =
  | { ok: true; data: OwnedCryptournsResponse }
  | { ok: false; error: string };

/**
 * Loads Cryptourns ERC-721s for a wallet — Alchemy scoped to the Cryptourns
 * contract only (no full-wallet NFT enumeration).
 */
export async function fetchOwnedCryptourns(
  address: string,
): Promise<FetchOwnedCryptournsResult> {
  const parsed = parsePortfolioAddress(address);
  if (!parsed) {
    return { ok: false, error: "Invalid wallet address." };
  }

  try {
    const data = await getOwnedCryptournsForWallet(parsed);
    return { ok: true, data };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load owned Cryptourns.";
    return { ok: false, error: message };
  }
}
