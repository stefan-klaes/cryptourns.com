import type { Address } from "viem";
import { getAddress, isAddress } from "viem";

/**
 * Parses a wallet address query param. Returns `null` if missing or invalid.
 */
export function parsePortfolioAddress(raw: string | null): Address | null {
  if (raw == null || raw.trim() === "") return null;
  const trimmed = raw.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed);
}
