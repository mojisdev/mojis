import type { AdapterContext, PossibleUrls, UrlFn } from "../src/types";
import { createCacheKeyFromUrl } from "@mojis/internal-utils";
import { describe, expect, it } from "vitest";
import {
  buildContext,
  BUILTIN_PARSERS,
  getHandlerUrls,
  isBuiltinParser,
  isUrlWithCache,
} from "../src/utils";

describe("is url with cache", () => {
  it.each([
    { value: { url: "https://example.com", cacheKey: "example" }, expected: true },
    { value: { url: "https://example.com" }, expected: false },
    { value: null, expected: false },
    { value: undefined, expected: false },
    { value: "not an object", expected: false },
    { value: 0, expected: false },
    { value: true, expected: false },
    { value: {}, expected: false },
  ])("should return $expected for $value", ({ value, expected }) => {
    expect(isUrlWithCache(value)).toBe(expected);
  });
});

describe("is builtin parser", () => {
  it.each([
    ...BUILTIN_PARSERS.map((parser) => ({ value: parser, expected: true })),

    // not valid parser
    { value: "not a builtin parser", expected: false },
    { value: () => "generic", expected: false },
    { value: null, expected: false },
    { value: undefined, expected: false },
    { value: 0, expected: false },
  ])("should return $expected for $value", ({ value, expected }) => {
    expect(isBuiltinParser(value)).toBe(expected);
  });
});

describe("getHandlerUrls", () => {
  const emptyContext = {} as AdapterContext;

  function makeUrlFn(obj: unknown) {
    return obj as UrlFn<PossibleUrls>;
  }

  it.each([
    [null],
    [undefined],
  ])("should return an empty array for %s input", async (input) => {
    const result = await getHandlerUrls(
      makeUrlFn(input),
      emptyContext,
    );
    expect(result).toEqual([]);
  });

  it.each([
    [123],
    ["string"],
    [{}],
    [[]],
  ])("should return an empty array for non-function input %s", async (input) => {
    const result = await getHandlerUrls(
      makeUrlFn(input),
      emptyContext,
    );
    expect(result).toEqual([]);
  });

  it.each([
    [() => null],
    [() => undefined],
  ])("should return an empty array when function returns %s", async (input) => {
    const result = await getHandlerUrls(
      makeUrlFn(input),
      emptyContext,
    );
    expect(result).toEqual([]);
  });

  it.each([
    ["https://example.com"],
    ["http://test.com"],
  ])("should create UrlWithCache for string URL %s", async (url) => {
    const result = await getHandlerUrls(
      makeUrlFn(() => url),
      emptyContext,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      url,
      cacheKey: expect.any(String),
      key: expect.any(String),
    });
  });

  it("should handle array of string URLs", async () => {
    const urls = ["https://example1.com", "https://example2.com"];
    const urlFn = () => urls;
    const result = await getHandlerUrls(urlFn, emptyContext);

    expect(result).toHaveLength(2);
    result.forEach((item, index) => {
      expect(item).toEqual({
        url: urls[index],
        cacheKey: expect.any(String),
        key: expect.any(String),
      });
    });
  });

  it.each([
    [{ url: "https://example.com" }],
    [{ url: "https://example.com", key: null }],
    [{ url: "https://example.com", cacheKey: null }],
    [{ url: "https://example.com", key: undefined }],
    [{ url: "https://example.com", cacheKey: undefined }],
  ])("should generate key and cacheKey for URL object with missing properties %#", async (urlObj) => {
    const result = await getHandlerUrls(
      makeUrlFn(() => urlObj),
      emptyContext,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      url: urlObj.url,
      cacheKey: expect.any(String),
      key: expect.any(String),
    });

    const generatedCacheKey = createCacheKeyFromUrl(urlObj.url);

    expect(result[0]?.cacheKey).toBe(generatedCacheKey);
    expect(result[0]?.key).toBe(generatedCacheKey);
  });

  it("should handle mixed input types in array", async () => {
    const urls = [
      "https://example1.com",
      { url: "https://example2.com" },
      null,
      undefined,
    ];
    const result = await getHandlerUrls(
      makeUrlFn(() => urls),
      emptyContext,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      url: "https://example1.com",
      cacheKey: expect.any(String),
      key: expect.any(String),
    });
    expect(result[1]).toEqual({
      url: "https://example2.com",
      cacheKey: expect.any(String),
      key: expect.any(String),
    });
  });
});

describe("buildContext", () => {
  it("should merge context objects", () => {
    const ctx = {
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
    } as AdapterContext;
    const extraContext = { foo: "bar", baz: 123 };
    const result = buildContext(ctx, extraContext);
    expect(result).toEqual({
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
      foo: "bar",
      baz: 123,
    });
  });

  it("should override properties in the original context", () => {
    const ctx = {
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
    } as AdapterContext;
    const extraContext = { foo: "override" };
    const result = buildContext(ctx, extraContext);
    expect(result).toEqual({
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
      foo: "override",
    });
  });

  it("should handle empty extra context", () => {
    const ctx = {
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
    } as AdapterContext;
    const extraContext = {};
    const result = buildContext(ctx, extraContext);
    expect(result).toEqual({
      force: false,
      emoji_version: "1.0",
      unicode_version: "1.0",
    });
  });
});
