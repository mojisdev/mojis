import type { CacheMeta } from "../src/cache";
import fs from "fs-extra";
import { HttpResponse } from "msw";
import { mockFetch } from "test/msw-utils/msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { createCacheKeyFromUrl, fetchCache, readCache, readCacheMeta, writeCache } from "../src/cache";

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

describe("write cache", () => {
  it("should write data to cache", async () => {
    const testdirPath = await testdir({});
    const testData = { foo: "bar" };
    const cacheName = "test-cache";

    await writeCache(cacheName, JSON.stringify(testData), {
      cacheFolder: testdirPath,
    });

    expect(fs.ensureDir).toHaveBeenCalledWith(testdirPath);
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/${cacheName}`,
      JSON.stringify(testData),
      "utf-8",
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/${cacheName}.meta`,
      JSON.stringify({ encoding: "utf-8", ttl: -1 }),
      "utf-8",
    );
  });

  it("should return the data that was written", async () => {
    const testData = "{\"test\":\"data\"}";
    const result = await writeCache("test", testData);
    expect(result).toEqual(testData);
  });

  it("should handle nested cache paths", async () => {
    const testData = { foo: "bar" };
    const cacheKey = "nested/path/test";

    await writeCache(cacheKey, JSON.stringify(testData));

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining("nested/path"));
  });

  it("should write Uint8Array data", async () => {
    const testdirPath = await testdir({});
    const testData = new Uint8Array([
      72,
      101,
      108,
      108,
      111,
      44,
      32,
      119,
      111,
      114,
      108,
      100,
    ]);

    const cacheName = "binary-cache";

    await writeCache(cacheName, testData, { cacheFolder: testdirPath, encoding: null });

    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/${cacheName}`,
      testData,
      undefined,
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/${cacheName}.meta`,
      JSON.stringify({ encoding: undefined, ttl: -1 }),
      "utf-8",
    );
  });

  it("should use a custom encoding", async () => {
    const testdirPath = await testdir({});
    const testData = "test data";
    const encoding = "base64";

    await writeCache("encoded", testData, {
      cacheFolder: testdirPath,
      encoding,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/encoded`,
      testData,
      encoding,
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/encoded.meta`,
      JSON.stringify({ encoding, ttl: -1 }),
      "utf-8",
    );
  });

  it("should apply a transform function", async () => {
    const testdirPath = await testdir({});
    const testData = "test data";
    const transform = (data: string) => data.toUpperCase();
    const transformedData = transform(testData);

    await writeCache("transformed", testData, {
      cacheFolder: testdirPath,
      transform,
    });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("transformed"),
      transformedData,
      "utf-8",
    );
  });

  it("should write metadata with a TTL", async () => {
    const testdirPath = await testdir({});
    const ttl = 1; // 1 second
    const now = new Date();
    const expectedTtl = new Date(now.getTime() + ttl * 1000).getTime();

    await writeCache("ttl", "test", { cacheFolder: testdirPath, ttl });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(".meta"),
      expect.stringContaining("\"ttl\":"),
      "utf-8",
    );

    const metaFileWrite = vi.mocked(fs.writeFile).mock.calls.find((call) => call[0].toString().endsWith(".meta"));
    if (metaFileWrite) {
      const metaObject = JSON.parse(metaFileWrite[1].toString());
      expect(metaObject.ttl).toBeGreaterThanOrEqual(expectedTtl - 100);
      expect(metaObject.ttl).toBeLessThanOrEqual(expectedTtl + 100);
    }
  });

  it("should handle special character cache keys", async () => {
    const testdirPath = await testdir({});
    const specialKey = "some/special/key/with:colon*asterisk?question";
    await writeCache(specialKey, "test", { cacheFolder: testdirPath });

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(specialKey),
      "test",
      "utf-8",
    );
  });
});

describe("read cache", () => {
  it("should read data from cache file", async () => {
    const testdirPath = await testdir({});

    const testData = { foo: "bar" };
    const cacheName = "test-cache";

    await writeCache(cacheName, JSON.stringify(testData), {
      cacheFolder: testdirPath,
    });
    const result = await readCache(cacheName, JSON.parse, testdirPath);

    expect(result).toEqual(testData);
  });

  it("should return undefined for non-existent cache", async () => {
    const result = await readCache("non-existent");

    expect(fs.pathExists).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("should properly parse JSON data", async () => {
    const testdirPath = await testdir({});

    const complexData = {
      nested: { foo: "bar" },
      array: [1, 2, 3],
      string: "test",
    };

    await writeCache("complex", JSON.stringify(complexData), {
      cacheFolder: testdirPath,
    });

    const result = await readCache("complex", JSON.parse, testdirPath);

    expect(result).toEqual(complexData);
  });

  it("should return undefined if cache meta doesn't exist", async () => {
    const testdirPath = await testdir({
      "no-meta": "test data",
    });

    const result = await readCache("no-meta", (data) => data, testdirPath);

    expect(result).toBeUndefined();
  });

  it("should return undefined if cache is expired", async () => {
    const testdirPath = await testdir({
      "expired": "test data",
      "expired.meta": JSON.stringify({ ttl: Date.now() - 1000 }),
    });

    // ensure that both the cache and meta files exist
    expect(await fs.pathExists(`${testdirPath}/expired`)).toBe(true);
    expect(await fs.pathExists(`${testdirPath}/expired.meta`)).toBe(true);

    const result = await readCache("expired", (data) => data, testdirPath);

    expect(result).toBeUndefined();

    // ensure that the cache and meta files were deleted
    expect(await fs.pathExists(`${testdirPath}/expired`)).toBe(false);
    expect(await fs.pathExists(`${testdirPath}/expired.meta`)).toBe(false);
  });
});

describe("read cache meta", () => {
  it("should read cache metadata from file", async () => {
    const testdirPath = await testdir({});
    const cacheKey = "test-cache";
    const meta: CacheMeta = { encoding: "utf-8", ttl: 12345 };
    const metaFilePath = `${testdirPath}/${cacheKey}.meta`;

    await fs.writeFile(metaFilePath, JSON.stringify(meta), "utf-8");

    const result = await readCacheMeta(cacheKey, testdirPath);

    expect(result).toEqual(meta);
  });

  it("should return undefined if metadata file does not exist", async () => {
    const testdirPath = await testdir({});
    const cacheKey = "non-existent-cache";

    const result = await readCacheMeta(cacheKey, testdirPath);

    expect(result).toBeUndefined();
  });
});

describe("fetchCache", () => {
  it("should return cached data if available and bypass not set", async () => {
    const testData = { foo: "bar" };
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
    };

    vi.mocked(fs.readFile).mockReturnValue(JSON.stringify(testData) as never);
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);

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
    };

    mockFetch("https://mojis.dev", "get", () => {
      return HttpResponse.json(rawData, { status: 200 });
    });

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);

    expect(result).toEqual(parsedData);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("should throw error on failed fetch", async () => {
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
      bypassCache: true,
    };

    mockFetch("https://mojis.dev/", "get", () => {
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
    };

    mockFetch("https://mojis.dev", "get", () => {
      return HttpResponse.text(rawData, { status: 200 });
    });

    const result = await fetchCache("https://mojis.dev", options);

    expect(result).toEqual(parsedData);
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

    // should strip query, hash and port from url
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
