import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { extractEmojiVersion, extractVersionFromReadme, getCurrentDraftVersion } from "../src/versions";

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

  it("throws when fetch fails", async () => {
    fetchMock.mockResponse("Not Found", { status: 404 });

    await expect(getCurrentDraftVersion()).rejects.toThrow("failed to fetch");
  });

  it("throws when versions do not match", async () => {
    fetchMock
      .mockResponseOnceIf("https://unicode.org/Public/draft/ReadMe.txt", "Version 15.1.0 of the Unicode Standard")
      .mockResponseOnceIf("https://unicode.org/Public/draft/emoji/ReadMe.txt", "Unicode Emoji, Version 15.0");

    await expect(getCurrentDraftVersion()).rejects.toThrow("draft versions do not match");
  });

  it("throws when version extraction fails", async () => {
    fetchMock
      .mockResponse("Invalid version format", { status: 200 });

    await expect(getCurrentDraftVersion()).rejects.toThrow("failed to extract draft version");
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

// describe("get all emoji versions", () => {
//   it("should return all emoji versions", async () => {
//     fetchMock
//       .mockResponseOnceIf("https://unicode.org/Public/", "Version 15.1.0 of the Unicode Standard")
//       .mockResponseOnceIf("https://unicode.org/Public/emoji/", "Unicode Emoji, Version 15.1");

//     const result = await getCurrentDraftVersion();
//     expect(result).toEqual({
//       emoji_version: "15.1",
//       unicode_version: "15.1.0",
//     });
//   });
// });
