import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import { buildMintWriteParams } from "./mintTx";

const A = "0x1111111111111111111111111111111111111111" as Address;
const B = "0x2222222222222222222222222222222222222222" as Address;
const C = "0x3333333333333333333333333333333333333333" as Address;
const REF = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;

describe("buildMintWriteParams", () => {
  const price = 1_000_000_000_000_000_000n;

  it("single receiver without referral uses mint", () => {
    expect(buildMintWriteParams([A], price)).toEqual({
      functionName: "mint",
      args: [A],
      value: price,
    });
  });

  it("single receiver with referral uses mintReferral", () => {
    expect(buildMintWriteParams([A], price, REF)).toEqual({
      functionName: "mintReferral",
      args: [A, REF],
      value: price,
    });
  });

  it("multiple receivers without referral uses mintBulk", () => {
    expect(buildMintWriteParams([A, B], price)).toEqual({
      functionName: "mintBulk",
      args: [[A, B]],
      value: price * 2n,
    });
  });

  it("multiple receivers with referral uses mintAdvanced", () => {
    expect(buildMintWriteParams([A, B, C], price, REF)).toEqual({
      functionName: "mintAdvanced",
      args: [[A, B, C], REF],
      value: price * 3n,
    });
  });

  it("throws when no receivers", () => {
    expect(() => buildMintWriteParams([], price)).toThrow(
      "At least one mint receiver is required",
    );
  });
});
