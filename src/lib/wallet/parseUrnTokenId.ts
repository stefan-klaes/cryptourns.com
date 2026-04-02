/**
 * Parse indexer / wallet token id strings for Cryptourn routes and labels.
 * Prefer decimal strings; `BigInt` accepts `0x…` hex from APIs like Alchemy.
 */
export function parseUrnIdFromTokenId(tokenId: string): number | null {
  try {
    const n = BigInt(tokenId);
    if (n < BigInt(1)) return null;
    if (n > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return Number(n);
  } catch {
    return null;
  }
}
