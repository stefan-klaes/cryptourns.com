import { formatUnits } from "viem";

/**
 * Format an atomic balance (e.g. wei) with exactly `displayDecimals` digits
 * after the decimal (padded with zeros). Uses `chainDecimals` for the unit
 * scale (18 for ETH).
 */
export function formatEthereum(
  atomic: bigint,
  displayDecimals = 4,
  chainDecimals = 18,
): string {
  const s = formatUnits(atomic, chainDecimals);
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return `0.${"0".repeat(displayDecimals)}`;
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  }).format(n);
}
