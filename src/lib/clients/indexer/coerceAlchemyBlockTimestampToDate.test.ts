import { describe, expect, it } from "vitest";
import { coerceAlchemyBlockTimestampToDate } from "./alchemy/parseAlchemyNft";

describe("coerceAlchemyBlockTimestampToDate", () => {
  it("returns null for zero, negative, and empty", () => {
    expect(coerceAlchemyBlockTimestampToDate(0)).toBeNull();
    expect(coerceAlchemyBlockTimestampToDate(-1)).toBeNull();
    expect(coerceAlchemyBlockTimestampToDate("0")).toBeNull();
    expect(coerceAlchemyBlockTimestampToDate("")).toBeNull();
    expect(coerceAlchemyBlockTimestampToDate(null)).toBeNull();
    expect(coerceAlchemyBlockTimestampToDate(undefined)).toBeNull();
  });

  it("treats small numeric magnitudes as Unix seconds", () => {
    const d = coerceAlchemyBlockTimestampToDate(1_704_067_200);
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("treats digit-only strings as Unix seconds when below 1e12", () => {
    const d = coerceAlchemyBlockTimestampToDate("1704067200");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("treats large magnitudes as milliseconds", () => {
    const d = coerceAlchemyBlockTimestampToDate(1_704_067_200_000);
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("parses ISO strings", () => {
    const d = coerceAlchemyBlockTimestampToDate("2024-01-01T00:00:00.000Z");
    expect(d).not.toBeNull();
    expect(d!.toISOString()).toBe("2024-01-01T00:00:00.000Z");
  });

  it("rejects epoch ISO (getTime 0)", () => {
    expect(
      coerceAlchemyBlockTimestampToDate("1970-01-01T00:00:00.000Z"),
    ).toBeNull();
  });
});
