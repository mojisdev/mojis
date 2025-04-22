import { describe, expect, it } from "vitest";
import {
  isEmojiVersionAllowed,
} from "../src/validation";

describe("is emoji version allowed", () => {
  it.each([
    { version: "11.0.0", expected: true },
    { version: "12.0.0", expected: true },
    { version: "13.0.0", expected: true },
    { version: "14.0.0", expected: true },
    { version: "15.0.0", expected: true },
    { version: "15.1.0", expected: true },
    { version: "16.0.0", expected: true },
  ])("returns true for major version >= 11: $version", async ({ version, expected }) => {
    expect(isEmojiVersionAllowed(version)).toBe(expected);
  });

  it.each([
    { version: "1.0.0", expected: true },
    { version: "2.0.0", expected: true },
    { version: "3.0.0", expected: true },
    { version: "4.0.0", expected: true },
    { version: "5.0.0", expected: true },
  ])("returns true for major versions 1-5: $version", async ({ version, expected }) => {
    expect(isEmojiVersionAllowed(version)).toBe(expected);
  });

  it.each([
    { version: "6.0.0", expected: false },
    { version: "7.0.0", expected: false },
    { version: "8.0.0", expected: false },
    { version: "9.0.0", expected: false },
    { version: "10.0.0", expected: false },
  ])("returns false for major versions 6-10: $version", async ({ version, expected }) => {
    expect(isEmojiVersionAllowed(version)).toBe(expected);
  });

  it.each([
    { version: "1.1.0", expected: false },
    { version: "2.1.0", expected: false },
    { version: "3.1.0", expected: false },
    { version: "4.1.0", expected: false },
    { version: "5.1.0", expected: false },
  ])("returns false for minor versions within 1-5: $version", async ({ version, expected }) => {
    expect(isEmojiVersionAllowed(version)).toBe(expected);
  });

  it.each([
    { version: "1.0.1", expected: false },
    { version: "2.0.1", expected: false },
    { version: "3.0.1", expected: false },
    { version: "4.0.1", expected: false },
    { version: "5.0.1", expected: false },
  ])("returns false for patch versions within 1-5: $version", async ({ version, expected }) => {
    expect(isEmojiVersionAllowed(version)).toBe(expected);
  });

  it("should return false for invalid versions", async () => {
    expect(isEmojiVersionAllowed("invalid")).toBe(false);
    expect(isEmojiVersionAllowed("abc")).toBe(false);
    expect(isEmojiVersionAllowed(null as any)).toBe(false);
  });
});
