import { describe, expect, it } from "vitest";
import { formatSentToUrnRelative, parseValidDate } from "./formatSentToUrn";

describe("formatSentToUrn", () => {
  it("parseValidDate rejects invalid", () => {
    expect(parseValidDate(null)).toBeNull();
    expect(parseValidDate("")).toBeNull();
    expect(parseValidDate("not-a-date")).toBeNull();
  });

  it("formatSentToUrnRelative returns distance and ISO dateTime", () => {
    const d = new Date(Date.now() - 86400000);
    const out = formatSentToUrnRelative(d);
    expect(out).not.toBeNull();
    expect(out!.relative).toMatch(/ago|day/);
    expect(out!.dateTime).toBe(d.toISOString());
    expect(out!.absoluteTitle.length).toBeGreaterThan(4);
  });
});
