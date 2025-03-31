import type { Buffer } from "node:buffer";
import { mockFetch } from "#msw-utils";
import fs from "fs-extra";
import { HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createCache, createCacheKeyFromUrl, fetchCache } from "../src/cache";

vi.mock("fs-extra", {
  spy: true,
});

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("cache", () => {
  describe("cache:memory", () => {
    it("should store and retrieve data", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key", "value");
      const result = await cache.get("key");
      expect(result).toBe("value");
    });

    it("should handle ttl expiration", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key", "value", { ttl: 1 });

      // wait for ttl to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await cache.get("key");
      expect(result).toBeUndefined();
    });

    it("should handle deletion", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key", "value");
      await cache.delete("key");
      const result = await cache.get("key");
      expect(result).toBeUndefined();
    });

    it("should handle clearing all data", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key1", "value1");
      await cache.set("key2", "value2");
      await cache.clear();

      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toBeUndefined();
    });

    it("should handle non-existent keys", async () => {
      const cache = createCache<string>({ store: "memory" });
      const result = await cache.get("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("cache:filesystem", () => {
    it("should store and retrieve string data", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      await cache.set("key", "value");
      const result = await cache.get("key");
      expect(result).toBe("value");
    });

    it("should store and retrieve binary data", async () => {
      const testdirPath = await testdir({});
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const cache = createCache<Uint8Array>({
        store: "filesystem",
        cacheDir: testdirPath,
        encoding: null,
      });

      await cache.set("key", binaryData);
      const result = await cache.get("key");
      // convert buffer to uint8array for comparison
      expect(new Uint8Array(result as Buffer)).toEqual(binaryData);
    });

    it("should handle ttl expiration", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      await cache.set("key", "value", { ttl: 1 });

      // wait for ttl to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await cache.get("key");
      expect(result).toBeUndefined();
    });

    it("should handle nested paths", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      await cache.set("nested/path/key", "value");
      const result = await cache.get("nested/path/key");
      expect(result).toBe("value");
    });

    it("should handle special characters in keys", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      const specialKey = "special:chars*in?key";
      await cache.set(specialKey, "value");
      const result = await cache.get(specialKey);
      expect(result).toBe("value");
    });

    it("should handle concurrent operations", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      const operations = Array.from({ length: 10 }, (_, i) =>
        cache.set(`key${i}`, `value${i}`));

      await Promise.all(operations);

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          cache.get(`key${i}`)),
      );

      results.forEach((result, i) => {
        expect(result).toBe(`value${i}`);
      });
    });

    it("should handle file system errors gracefully", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error("File system error"));

      await cache.set("key", "value");

      const result = await cache.get("key");
      expect(result).toBeUndefined();
    });
  });

  describe("cache:edge-cases", () => {
    it("should handle empty values", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key", "");
      const result = await cache.get("key");
      expect(result).toBe("");
    });

    it("should handle very large values", async () => {
      const testdirPath = await testdir({});
      const cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });

      const largeValue = "x".repeat(1024 * 1024); // 1MB string
      await cache.set("key", largeValue);
      const result = await cache.get("key");
      expect(result).toBe(largeValue);
    });

    it("should handle very long keys", async () => {
      const cache = createCache<string>({ store: "memory" });
      const longKey = "x".repeat(1000);
      await cache.set(longKey, "value");
      const result = await cache.get(longKey);
      expect(result).toBe("value");
    });

    it("should handle concurrent deletions", async () => {
      const cache = createCache<string>({ store: "memory" });
      await cache.set("key", "value");

      const deletions = Array.from({ length: 5 }, () =>
        cache.delete("key"));

      await Promise.all(deletions);
      const result = await cache.get("key");
      expect(result).toBeUndefined();
    });

    it("should handle rapid ttl updates", async () => {
      const cache = createCache<string>({ store: "memory" });

      // set multiple ttls in quick succession
      await cache.set("key", "value1", { ttl: 1 });
      await cache.set("key", "value2", { ttl: 2 });
      await cache.set("key", "value3", { ttl: 3 });

      const result = await cache.get("key");
      expect(result).toBe("value3");
    });
  });
});

describe("fetchCache", () => {
  let testdirPath: string;
  let cache: ReturnType<typeof createCache<string>>;

  beforeEach(async () => {
    testdirPath = await testdir({});
    cache = createCache<string>({ store: "filesystem", cacheDir: testdirPath });
  });

  it("should return cached data if available and bypass not set", async () => {
    const testData = { foo: "bar" };
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
      cache,
    };

    await cache.set("test-cache", JSON.stringify(testData));

    mockFetch("GET https://mojis.dev", () => {
      return HttpResponse.text(JSON.stringify(testData), { status: 200 });
    });

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);
    expect(result).toEqual(testData);
  });

  it("should fetch and cache new data when bypass is true", async () => {
    const rawData = "{\"foo\":\"bar\"}";
    const parsedData = { foo: "bar" };

    const options = {
      cacheKey: "test-cache.json",
      parser: JSON.parse,
      bypassCache: true,
      cache,
    };

    mockFetch("GET https://mojis.dev", () => {
      return HttpResponse.text(rawData, { status: 200 });
    });

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);
    expect(result).toEqual(parsedData);
  });

  it("should throw error on failed fetch", async () => {
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
      bypassCache: true,
      cache,
    };

    mockFetch("GET https://mojis.dev/", () => {
      return new HttpResponse("Not Found", { status: 404 });
    });

    await expect(fetchCache("https://mojis.dev", options))
      .rejects
      .toThrow("failed to fetch: url=(https://mojis.dev) status=(404)");
  });

  it("should use custom parser function", async () => {
    const rawData = "test,data";
    const parsedData = ["test", "data"];
    const options = {
      cacheKey: "csv-cache",
      parser: (data: string) => data.split(","),
      bypassCache: true,
      cache,
    };

    mockFetch("GET https://mojis.dev", () => {
      return HttpResponse.text(rawData, { status: 200 });
    });

    const result = await fetchCache<string[]>("https://mojis.dev", options);
    expect(result).toEqual(parsedData);
  });

  it("should respect cache TTL", async () => {
    const testData = { foo: "bar" };
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
      cacheOptions: { ttl: 1 },
      cache,
    };

    await cache.set("test-cache", JSON.stringify(testData), { ttl: 1 });

    // wait for ttl to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    mockFetch("GET https://mojis.dev", () => {
      return HttpResponse.text(JSON.stringify({ foo: "new" }), { status: 200 });
    });

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);
    expect(result).toEqual({ foo: "new" });
  });

  it("should create a new cache when not provided", async () => {
    const testData = { foo: "bar" };
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
    };

    mockFetch("GET https://mojis.dev", () => {
      return HttpResponse.text(JSON.stringify(testData), { status: 200 });
    });

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);
    expect(result).toEqual(testData);
  });
});

describe("create cache keys from url", () => {
  it.each([
    {
      url: "https://mojis.dev",
      expected: "mojis_dev",
    },
    {
      url: "https://example.com",
      expected: "example_com",
    },
    {
      url: "https://mojis.dev/emojis",
      expected: "mojis_dev_emojis",
    },
    {
      url: "https://example.com/path/to/resource",
      expected: "example_com_path_to_resource",
    },
    {
      url: "https://test.com/path-with-hyphens",
      expected: "test_com_path_with_hyphens",
    },
    {
      url: "http://localhost:3000/api",
      expected: "localhost_api",
    },
    {
      url: "https://example.com:8080/path",
      expected: "example_com_path",
    },
    {
      url: "https://mojis.dev/search?q=smile&sort=asc",
      expected: "mojis_dev_search",
    },
    {
      url: "https://api.example.com/v1/data?id=123",
      expected: "api_example_com_v1_data",
    },
    {
      url: "https://mojis.dev/page#section",
      expected: "mojis_dev_page",
    },
  ])("should convert %s to %s", ({ url, expected }) => {
    expect(createCacheKeyFromUrl(url)).toBe(expected);
  });
});
