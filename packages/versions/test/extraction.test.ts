import fs from "node:fs";
import {
  extractEmojiVersion,
  extractUnicodeVersion,
  extractVersionFromReadme,
} from "@mojis/versions";
import { describe, expect, it } from "vitest";

describe("extractVersionFromReadme", () => {
  it.each([
    { input: "Version 15.1.0 of the Unicode Standard", expected: "15.1.0" },
    { input: "Version 15.1 of the Unicode Standard", expected: "15.1" },
    { input: "Version 15.0 of the Unicode Standard", expected: "15.0" },
    { input: "Version 5.0 of the Unicode Standard", expected: "5.0" },
  ])("should extract valid version numbers (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(extractVersionFromReadme(input)).toBe(expected);
  });

  it.each([
    { input: "Invalid version format", expected: null },
    { input: "Version 15.1.0", expected: null },
    { input: "Version 15", expected: null },
    { input: "", expected: null },
  ])("should return null for invalid formats (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(extractVersionFromReadme(input)).toBe(expected);
  });

  describe.each([
    { name: "emoji draft readme", path: "emoji/README-valid.txt", version: "17.0" },
    { name: "invalid emoji draft readme", path: "emoji/README-invalid.txt", version: null },

    { name: "draft readme", path: "root/README-valid.txt", version: "17.0.0" },
    { name: "invalid draft readme", path: "root/README-invalid.txt", version: null },
  ])("extract version from $name", ({ path, version }) => {
    it("should extract version from file path", () => {
      const content = fs.readFileSync(`./test/fixtures/extract-version/${path}`, "utf-8");
      expect(extractVersionFromReadme(content)).toBe(version);
    });
  });
});

describe("extractEmojiVersion", () => {
  it.each([
    { input: "E14.0", expected: "14.0" },
    { input: "E15.1", expected: "15.1" },
    { input: "E5.0", expected: "5.0" },
  ])("should extract valid emoji version numbers (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(extractEmojiVersion(input)).toBe(expected);
  });

  it.each([
    { input: "14.0", expected: null },
    { input: "Hello E14", expected: null },
    { input: "E14", expected: null },
    { input: "", expected: null },
  ])("should return null for invalid formats (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(extractEmojiVersion(input)).toBe(expected);
  });

  it.each([
    { input: " E14.0 ", expected: "14.0" },
    { input: "E 14.0", expected: null },
  ])("should handle whitespace (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(extractEmojiVersion(input)).toBe(expected);
  });
});

describe("extractUnicodeVersion", () => {
  it("should return null if emojiVersion is null", () => {
    expect(extractUnicodeVersion(null)).toBeNull();
  });

  it("should return null if emojiVersion is invalid", () => {
    expect(extractUnicodeVersion("invalid")).toBeNull();
  });

  it("should return emojiVersion if unicodeVersion is not provided and emojiVersion is >= 11.0.0", () => {
    expect(extractUnicodeVersion("11.0.0")).toBe("11.0.0");
    expect(extractUnicodeVersion("12.0.0")).toBe("12.0.0");
  });

  it("should return emojiVersion if unicodeVersion is invalid and emojiVersion is >= 11.0.0", () => {
    expect(extractUnicodeVersion("11.0.0", "invalid")).toBe("11.0.0");
  });

  it("returns the lower version for valid emoji and unicode versions (emoji >= 11)", () => {
    expect(extractUnicodeVersion("11.0.0", "12.0.0")).toBe("11.0.0");
    expect(extractUnicodeVersion("12.0.0", "11.0.0")).toBe("11.0.0");
  });

  it("should return the mapped unicode version if emojiVersion is < 11.0.0", () => {
    expect(extractUnicodeVersion("1.0")).toBe("8.0");
    expect(extractUnicodeVersion("5.0")).toBe("10.0");
  });

  it("should return '6.0' if emojiVersion is < 11.0.0 and not in the version map", () => {
    expect(extractUnicodeVersion("6.0")).toBe("6.0");
    expect(extractUnicodeVersion("10.0")).toBe("6.0");
  });

  it("should handle emojiVersion 0.7 correctly", () => {
    expect(extractUnicodeVersion("0.7")).toBe("7.0");
  });
});
