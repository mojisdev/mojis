import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { fetchCache, readCache, writeCache } from "../src/cache";

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
});

describe("read cache", () => {
  it("should read data from cache file", async () => {
    const testdirPath = await testdir({
    });

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

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should fetch and cache new data when bypass is true", async () => {
    const rawData = "{\"foo\":\"bar\"}";
    const parsedData = { foo: "bar" };

    const options = {
      cacheKey: "test-cache.json",
      parser: JSON.parse,
      bypassCache: true,
    };

    fetchMock.mockResponse(rawData);

    const result = await fetchCache<Record<string, string>>("https://mojis.dev", options);

    expect(result).toEqual(parsedData);
    expect(fetch).toHaveBeenCalledWith("https://mojis.dev", undefined);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it("should throw error on failed fetch", async () => {
    const options = {
      cacheKey: "test-cache",
      parser: JSON.parse,
      bypassCache: true,
    };

    fetchMock.mockResponse("Not Found", { status: 404 });

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

    fetchMock.mockResponse(rawData);

    const result = await fetchCache("https://mojis.dev", options);

    expect(result).toEqual(parsedData);
  });
});
