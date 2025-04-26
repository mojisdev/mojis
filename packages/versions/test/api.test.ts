import type { EmojiSpecRecord } from "@mojis/schemas/emojis";
import { mockFetch } from "#msw-utils";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
  getAllEmojiVersions,
  getCurrentDraftVersion,
  getLatestEmojiVersion,
} from "../src/api";

describe("all emoji versions", () => {
  it("should fail if fetch fails", async () => {
    mockFetch("GET *", () => {
      return new HttpResponse("Not Found", { status: 404 });
    });

    await expect(() => getAllEmojiVersions()).rejects.toThrow("failed to fetch root or emoji page");
  });

  it("should throw if fetch returns invalid data", async () => {
    mockFetch([
      ["GET https://unicode-proxy.ucdjs.dev/proxy/", () => HttpResponse.text("Not Found", { status: 400 })],
      ["GET https://unicode-proxy.ucdjs.dev/proxy/emoji/", () => HttpResponse.text("Not Found", { status: 400 })],
    ]);

    await expect(() => getAllEmojiVersions()).rejects.toThrow("failed to fetch root or emoji page");
  });

  it("should throw if empty data is returned", async () => {
    mockFetch([
      ["GET https://unicode-proxy.ucdjs.dev/proxy/", () => HttpResponse.text("")],
      ["GET https://unicode-proxy.ucdjs.dev/proxy/emoji/", () => HttpResponse.text("")],
    ]);

    await expect(() => getAllEmojiVersions()).rejects.toThrow("failed to fetch root or emoji page");
  });
});

describe("draft", () => {
  it("returns draft versions when fetches succeed and versions match", async () => {
    mockFetch([
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/ReadMe.txt", () => HttpResponse.text("Version 15.1.0 of the Unicode Standard")],
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/emoji/ReadMe.txt", () => HttpResponse.text("Unicode Emoji, Version 15.1")],
    ]);

    const result = await getCurrentDraftVersion();
    expect(result).toEqual({
      emoji_version: "15.1",
      unicode_version: "15.1.0",
    });
  });

  it("should throw when versions do not match", async () => {
    mockFetch([
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/ReadMe.txt", () => HttpResponse.text("Version 15.1.0 of the Unicode Standard")],
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/emoji/ReadMe.txt", () => HttpResponse.text("Unicode Emoji, Version 15.0")],
    ]);

    await expect(() => getCurrentDraftVersion()).rejects.toThrow("draft versions do not match");
  });

  it("should throw if fetch fails", async () => {
    mockFetch("GET *", () => {
      return new HttpResponse("Not Found", { status: 404 });
    });

    await expect(() => getCurrentDraftVersion()).rejects.toThrow("failed to fetch https://unicode-proxy.ucdjs.dev/proxy/draft/ReadMe.txt: 404");
  });

  it("should throw if emoji version is invalid", async () => {
    mockFetch([
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/ReadMe.txt", () => HttpResponse.text("")],
      ["GET https://unicode-proxy.ucdjs.dev/proxy/draft/emoji/ReadMe.txt", () => HttpResponse.text("Unicode Emoji, Version 15.0")],
    ]);

    await expect(() => getCurrentDraftVersion()).rejects.toThrow("failed to extract draft version");
  });
});

describe("getLatestEmojiVersion", () => {
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
