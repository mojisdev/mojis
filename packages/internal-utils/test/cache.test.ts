import fs from "fs-extra";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { readCache, writeCache } from "../src/cache";

vi.mock("fs-extra");

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
    vi.stubEnv("CACHE_DIR", testdirPath);

    const testData = { foo: "bar" };
    const cacheName = "test-cache.json";

    await writeCache(cacheName, testData);

    expect(fs.ensureDir).toHaveBeenCalledWith(`${testdirPath}/.cache`);
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${testdirPath}/.cache/${cacheName}`,
      JSON.stringify(testData, null, 2),
      "utf-8",
    );
  });

  it("should return the data that was written", async () => {
    const testData = { test: "data" };
    const result = await writeCache("test.json", testData);
    expect(result).toEqual(testData);
  });

  it("should handle nested cache paths", async () => {
    const testData = { foo: "bar" };
    const cachePath = "nested/path/test.json";

    await writeCache(cachePath, testData);

    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining("nested/path"));
  });
});

describe("read cache", () => {
  it("should return undefined if file does not exist", async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    const result = await readCache("nonexistent.json");

    expect(result).toBeUndefined();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it("should read and parse JSON data from file", async () => {
    const testData = { test: "data" };
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(testData));

    const result = await readCache("test.json");
    expect(result).toEqual(testData);
  });
});
