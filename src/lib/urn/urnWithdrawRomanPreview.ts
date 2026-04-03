import { AssetType } from "@/generated/prisma";
import { romanize } from "@/lib/urn/romanNumerals";

export function formatRomanNumeralLabel(nftUnitCount: number): string {
  if (nftUnitCount <= 0) return "—";
  const r = romanize(nftUnitCount);
  return r || "—";
}

/** NFT-unit delta applied to the urn mosaic roman numeral (ERC-20 does not change it). */
export function nftUnitDeltaForWithdraw(
  assetType: AssetType,
  quantitySending: number,
): number {
  if (assetType === AssetType.ERC20) return 0;
  if (!Number.isFinite(quantitySending) || quantitySending <= 0) return 0;
  return Math.floor(quantitySending);
}

export function computeWithdrawRomanPreview(
  totalNftUnits: number,
  assetType: AssetType,
  quantitySending: number,
): {
  beforeLabel: string;
  afterLabel: string;
  romanChanges: boolean;
  afterNftUnits: number;
} {
  const delta = nftUnitDeltaForWithdraw(assetType, quantitySending);
  const afterNftUnits = Math.max(0, totalNftUnits - delta);
  return {
    beforeLabel: formatRomanNumeralLabel(totalNftUnits),
    afterLabel: formatRomanNumeralLabel(afterNftUnits),
    romanChanges: delta > 0,
    afterNftUnits,
  };
}
