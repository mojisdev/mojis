import type { EmojiSpecRecord } from "../src/types";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractEmojiVersion,
  extractVersionFromReadme,
  getCurrentDraftVersion,
  getLatestEmojiVersion,
  isEmojiVersionValid,
  mapEmojiVersionToUnicodeVersion,
  toSemverCompatible,
} from "../src/versions";

describe("get draft version", () => {
  it("returns draft versions when fetches succeed and versions match", async () => {
    fetchMock
      .mockResponseOnceIf("https://unicode.org/Public/draft/ReadMe.txt", "Version 15.1.0 of the Unicode Standard")
      .mockResponseOnceIf("https://unicode.org/Public/draft/emoji/ReadMe.txt", "Unicode Emoji, Version 15.1");

    const result = await getCurrentDraftVersion();
    expect(result).toEqual({
      emoji_version: "15.1",
      unicode_version: "15.1.0",
    });
  });

  it("returns null when fetch fails", async () => {
    fetchMock.mockResponse("Not Found", { status: 404 });

    expect(await getCurrentDraftVersion()).toBeNull();
  });

  it("returns null when versions do not match", async () => {
    fetchMock
      .mockResponseOnceIf("https://unicode.org/Public/draft/ReadMe.txt", "Version 15.1.0 of the Unicode Standard")
      .mockResponseOnceIf("https://unicode.org/Public/draft/emoji/ReadMe.txt", "Unicode Emoji, Version 15.0");

    expect(await getCurrentDraftVersion()).toBeNull();
  });

  it("returns null when version extraction fails", async () => {
    fetchMock
      .mockResponse("Invalid version format", { status: 200 });

    expect(await getCurrentDraftVersion()).toBeNull();
  });
});

describe("extract version", () => {
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

  describe("extract emoji version", () => {
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
});

describe("map emoji version to unicode version", () => {
  it.each([
    { input: "1.0", expected: "8.0" },
    { input: "15.0", expected: "15.0" },
    { input: "15.1", expected: "15.1" },
    { input: "13.1", expected: "13.0" },
  ])("should map emoji version to unicode version (input: $input, expected: $expected)", ({ input, expected }) => {
    expect(mapEmojiVersionToUnicodeVersion(input)).toBe(expected);
  });
});

describe("convert to semver compatible version", () => {
  it.each([
    { input: "1.0", expected: "1.0.0" },
    { input: "15.0", expected: "15.0.0" },
    { input: "15.1", expected: "15.1.0" },
    { input: "13.1", expected: "13.1.0" },
    { input: "x.0.0", expected: "0.0.0" }, // correctly coerced to 0.0.0
    { input: "1.2.3", expected: "1.2.3" }, // full semver
    { input: "v2.0.0", expected: "2.0.0" }, // leading "v"
    { input: "3.1.4-alpha", expected: "3.1.4" }, // extra characters
    { input: "1.0.0+build.123", expected: "1.0.0" }, // build metadata
    { input: "1.2.0-beta.1", expected: "1.2.0" }, // prerelease
  ])(
    "should convert emoji version to semver compatible version (input: $input, expected: $expected)",
    ({ input, expected }) => {
      expect(toSemverCompatible(input)).toBe(expected);
    },
  );

  it.each([
    { input: "invalid-version", expected: null },
    { input: "", expected: null },
    { input: null as any, expected: null },
    { input: undefined as any, expected: null },
  ])(
    "should return null when input is not coercible (input: $input)",
    ({ input, expected }) => {
      expect(toSemverCompatible(input)).toBe(expected);
    },
  );
});

describe("get latest emoji version", () => {
  it("returns the latest non-draft version", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "15.1", unicode_version: "15.1", draft: false },
      { emoji_version: "15.0", unicode_version: "15.0", draft: false },
      { emoji_version: "15.2", unicode_version: "15.2", draft: true }, // Drafts should be excluded
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toEqual({
      emoji_version: "15.1",
      unicode_version: "15.1",
      draft: false,
    });
  });

  it("returns null if all versions are drafts", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "15.0", unicode_version: "15.0", draft: true },
      { emoji_version: "15.1", unicode_version: "15.1", draft: true },
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toBeNull();
  });

  it("returns null if no versions are provided", () => {
    const result = getLatestEmojiVersion([]);
    expect(result).toBeNull();
  });

  it("returns the only non-draft version if only one is available", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "14.0", unicode_version: "14.0", draft: true },
      { emoji_version: "15.0", unicode_version: "15.0", draft: false },
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toEqual({
      emoji_version: "15.0",
      unicode_version: "15.0",
      draft: false,
    });
  });

  it("handles versions out of order", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "15.0", unicode_version: "15.0", draft: false },
      { emoji_version: "14.0", unicode_version: "14.0", draft: false },
      { emoji_version: "15.1", unicode_version: "15.1", draft: false },
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toEqual({
      emoji_version: "15.1",
      unicode_version: "15.1",
      draft: false,
    });
  });

  it("handles versions with fallback included", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "15.0", unicode_version: "15.0", draft: false },
      { emoji_version: "15.1", unicode_version: "15.1", draft: false, fallback: "some-fallback" },
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toEqual({
      emoji_version: "15.1",
      unicode_version: "15.1",
      draft: false,
      fallback: "some-fallback",
    });
  });

  it("ignores invalid versions gracefully (if the function doesn't validate)", () => {
    const versions: EmojiSpecRecord[] = [
      { emoji_version: "invalid", unicode_version: "15.0", draft: false },
      { emoji_version: "15.0", unicode_version: "15.0", draft: false },
    ];

    const result = getLatestEmojiVersion(versions);
    expect(result).toEqual({
      emoji_version: "15.0",
      unicode_version: "15.0",
      draft: false,
    });
  });
});

describe("is emoji version valid", () => {
  it.each([
    { version: "11.0.0", expected: true },
    { version: "12.0.0", expected: true },
    { version: "13.0.0", expected: true },
    { version: "14.0.0", expected: true },
    { version: "15.0.0", expected: true },
    { version: "15.1.0", expected: true },
    { version: "16.0.0", expected: true },
  ])("should return true for valid emoji versions >= 11.0.0 (version: $version)", async ({ version, expected }) => {
    expect(await isEmojiVersionValid(version)).toBe(expected);
  });

  it.each([
    { version: "1.0.0", expected: true },
    { version: "2.0.0", expected: true },
    { version: "3.0.0", expected: true },
    { version: "4.0.0", expected: true },
    { version: "5.0.0", expected: true },
  ])("should return true for valid emoji versions 1.0.0 - 5.0.0 (version: $version)", async ({ version, expected }) => {
    expect(await isEmojiVersionValid(version)).toBe(expected);
  });

  it.each([
    { version: "6.0.0", expected: false },
    { version: "7.0.0", expected: false },
    { version: "8.0.0", expected: false },
    { version: "9.0.0", expected: false },
    { version: "10.0.0", expected: false },
  ])("should return false for invalid emoji versions 6.0.0 - 10.0.0 (version: $version)", async ({ version, expected }) => {
    expect(await isEmojiVersionValid(version)).toBe(expected);
  });

  it.each([
    { version: "1.1.0", expected: false },
    { version: "2.1.0", expected: false },
    { version: "3.1.0", expected: false },
    { version: "4.1.0", expected: false },
    { version: "5.1.0", expected: false },
  ])("should return false for invalid emoji versions 1.1.0 - 5.1.0 (version: $version)", async ({ version, expected }) => {
    expect(await isEmojiVersionValid(version)).toBe(expected);
  });

  it.each([
    { version: "1.0.1", expected: false },
    { version: "2.0.1", expected: false },
    { version: "3.0.1", expected: false },
    { version: "4.0.1", expected: false },
    { version: "5.0.1", expected: false },
  ])("should return false for invalid emoji versions 1.0.1 - 5.0.1 (version: $version)", async ({ version, expected }) => {
    expect(await isEmojiVersionValid(version)).toBe(expected);
  });
});
