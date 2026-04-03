import { describe, expect, it } from "vitest";

import { isWalletUserRejection } from "@/lib/urn/walletUserRejection";

describe("isWalletUserRejection", () => {
  it("detects message patterns", () => {
    expect(isWalletUserRejection(new Error("User rejected the request."))).toBe(
      true,
    );
  });

  it("detects error code 4001", () => {
    expect(isWalletUserRejection({ code: 4001 })).toBe(true);
  });

  it("detects UserRejectedRequestError name", () => {
    const e = new Error("wrapped");
    e.name = "UserRejectedRequestError";
    expect(isWalletUserRejection(e)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isWalletUserRejection(new Error("insufficient funds"))).toBe(false);
  });
});
