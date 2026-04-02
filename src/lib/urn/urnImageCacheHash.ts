/**
 * Stable short hash for image URLs (`?h=`) so browsers refetch when indexed vault
 * totals or cracked state change (matches traits / generated artwork inputs).
 */
export type UrnImageCacheHashInput = {
  nftCount: number;
  coinCount: number;
  candleCount: number;
  cracked: boolean;
};

/** 8-char hex (FNV-1a 32-bit). */
export function buildUrnImageCacheHash(input: UrnImageCacheHashInput): string {
  const payload = [
    input.nftCount,
    input.coinCount,
    input.candleCount,
    input.cracked ? 1 : 0,
  ].join("|");

  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
