import type { AdapterContext, Arrayable, UrlWithCache } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import { BUILTIN_PARSERS, getHandlerUrls, isBuiltinParser, isUrlBuilder } from "../src/utils";

describe("is url builder", () => {
  it.each([
    [
      () => "https://example.com",
      true,
    ],
    [
      "https://example.com",
      false,
    ],
  ])("should return %p for %p", (value, expected) => {
    expect(isUrlBuilder(value)).toBe(expected);
  });
});

describe("is builtin parser", () => {
  it.each([
    ...(BUILTIN_PARSERS.map((parser) => [parser, true] as [string, boolean])),

    // not valid parser
    [
      "not a builtin parser",
      false,
    ],
    [
      () => "generic",
      false,
    ],
    [
      null,
      false,
    ],
    [
      undefined,
      false,
    ],
    [
      0,
      false,
    ],
  ])("should return %p for %p", (value, expected) => {
    expect(isBuiltinParser(value)).toBe(expected);
  });
});

describe("getHandlerUrls", () => {
  const ctx = {} as AdapterContext;

  it("should handle null or undefined inputs", async () => {
    expect(await getHandlerUrls(
      // @ts-expect-error null is not a valid input type
      null,
      ctx,
    )).toEqual([]);
    expect(await getHandlerUrls(undefined, ctx)).toEqual([]);
  });

  it("should handle single string URL", async () => {
    const result = await getHandlerUrls("https://example.com", ctx);
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
    ]);
  });

  it("should handle array of string URLs", async () => {
    const result = await getHandlerUrls(["https://example.com", "https://test.com"], ctx);
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
      { url: "https://test.com", cacheKey: "test_com", key: "test_com" },
    ]);
  });

  it("should handle array with null values", async () => {
    const result = await getHandlerUrls(
      [
        "https://example.com",
        null,
        "https://test.com",
      ] as Arrayable<string>,
      ctx,
    );
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
      { url: "https://test.com", cacheKey: "test_com", key: "test_com" },
    ]);
  });

  it("should handle UrlWithCache object", async () => {
    const urlObj = { url: "https://example.com", cacheKey: "custom-cache-key", key: "custom-cache-key" };
    const result = await getHandlerUrls(urlObj, ctx);
    expect(result).toEqual([urlObj]);
  });

  it("should handle array of UrlWithCache objects", async () => {
    const urlObj1 = { url: "https://example.com", cacheKey: "key-1", key: "key-1" };
    const urlObj2 = { url: "https://test.com", cacheKey: "key-2", key: "key-2" };
    const result = await getHandlerUrls([urlObj1, urlObj2], ctx);
    expect(result).toEqual([urlObj1, urlObj2]);
  });

  it("should handle UrlBuilder returning string", async () => {
    const urlBuilder = vi.fn().mockResolvedValue("https://example.com");
    const result = await getHandlerUrls(urlBuilder, ctx);
    expect(urlBuilder).toHaveBeenCalledWith(ctx);
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
    ]);
  });

  it("should handle UrlBuilder returning null/undefined", async () => {
    const urlBuilder = vi.fn().mockResolvedValue(null);
    const result = await getHandlerUrls(urlBuilder, ctx);
    expect(urlBuilder).toHaveBeenCalledWith(ctx);
    expect(result).toEqual([]);
  });

  it("should handle UrlBuilder returning UrlWithCache", async () => {
    const urlObj = { url: "https://example.com", cacheKey: "builder-key", key: "builder-key" };
    const urlBuilder = vi.fn().mockResolvedValue(urlObj);
    const result = await getHandlerUrls(urlBuilder, ctx);
    expect(urlBuilder).toHaveBeenCalledWith(ctx);
    expect(result).toEqual([urlObj]);
  });

  it("should handle UrlBuilder returning array of URLs", async () => {
    const urlBuilder = vi.fn().mockResolvedValue(["https://example.com", "https://test.com"]);
    const result = await getHandlerUrls(urlBuilder, ctx);
    expect(urlBuilder).toHaveBeenCalledWith(ctx);
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
      { url: "https://test.com", cacheKey: "test_com", key: "test_com" },
    ]);
  });

  it("should handle UrlBuilder returning array with null values", async () => {
    const urlBuilder = vi.fn().mockResolvedValue(["https://example.com", null, "https://test.com"]);
    const result = await getHandlerUrls(urlBuilder, ctx);
    expect(urlBuilder).toHaveBeenCalledWith(ctx);
    expect(result).toEqual([
      { url: "https://example.com", cacheKey: "example_com", key: "example_com" },
      { url: "https://test.com", cacheKey: "test_com", key: "test_com" },
    ]);
  });
});
