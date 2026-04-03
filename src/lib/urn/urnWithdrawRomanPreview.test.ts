import { AssetType } from "@/generated/prisma";
import { describe, expect, it } from "vitest";

import {
  computeWithdrawRomanPreview,
  formatRomanNumeralLabel,
  nftUnitDeltaForWithdraw,
} from "@/lib/urn/urnWithdrawRomanPreview";

describe("urnWithdrawRomanPreview", () => {
  it("formats zero as em dash", () => {
    expect(formatRomanNumeralLabel(0)).toBe("—");
  });

  it("ERC-20 sends do not change roman", () => {
    expect(nftUnitDeltaForWithdraw(AssetType.ERC20, 1_000)).toBe(0);
    const p = computeWithdrawRomanPreview(12, AssetType.ERC20, 500);
    expect(p.romanChanges).toBe(false);
    expect(p.afterNftUnits).toBe(12);
    expect(p.beforeLabel).toBe(p.afterLabel);
  });

  it("ERC-721 send reduces by one", () => {
    const p = computeWithdrawRomanPreview(5, AssetType.ERC721, 1);
    expect(p.romanChanges).toBe(true);
    expect(p.afterNftUnits).toBe(4);
    expect(p.beforeLabel).toBe("V");
    expect(p.afterLabel).toBe("IV");
  });

  it("ERC-1155 send reduces by quantity", () => {
    const p = computeWithdrawRomanPreview(10, AssetType.ERC1155, 3);
    expect(p.afterNftUnits).toBe(7);
  });
});
