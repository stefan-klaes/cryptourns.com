import { describe, expect, it } from "vitest";
import { getAddress } from "viem";

import { parsePortfolioAddress } from "./parsePortfolioAddress";

describe("parsePortfolioAddress", () => {
  it("returns null for null, empty, or invalid input", () => {
    expect(parsePortfolioAddress(null)).toBeNull();
    expect(parsePortfolioAddress("")).toBeNull();
    expect(parsePortfolioAddress("   ")).toBeNull();
    expect(parsePortfolioAddress("0x123")).toBeNull();
    expect(parsePortfolioAddress("not-an-address")).toBeNull();
  });

  it("returns checksummed address for valid input", () => {
    const lower = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    expect(parsePortfolioAddress(lower)).toBe(getAddress(lower));
  });

  it("trims whitespace", () => {
    const inner = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
    expect(parsePortfolioAddress(`  ${inner}  `)).toBe(getAddress(inner));
  });
});
