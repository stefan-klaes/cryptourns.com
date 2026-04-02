import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

export const REFERRAL_SESSION_KEY = "cryptourns_mint_ref";

export function parseReferralAddress(
  raw: string | null | undefined,
): Address | undefined {
  const trimmed = raw?.trim();
  if (!trimmed || !isAddress(trimmed)) return undefined;
  try {
    return getAddress(trimmed);
  } catch {
    return undefined;
  }
}
