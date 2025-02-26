import path from "node:path";
import process from "node:process";
import fs from "fs-extra";

function getCacheFolder(): string {
  return path.resolve(process.env.CACHE_DIR ?? process.cwd(), ".cache");
}

const LOCAL_CACHE = new Map<string, unknown>();

/**
 * Writes data to a cache file.
 *
 * @param {string} name - The name/path of the cache file to write to
 * @param {T} data - The data to write to the cache file
 * @template T - The type of data being cached
 * @returns {Promise<T>} A promise that resolves with the cached data
 */
export async function writeCache<T>(name: string, data: T): Promise<T> {
  const filePath = path.join(getCacheFolder(), name);

  // create directory if it doesn't exist
  await fs.ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, JSON.stringify(data, (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }

    return value;
  }, 2), "utf-8");

  return data;
}

/**
 * Reads and parses JSON data from a cache file.
 *
 * @param {string} name - The name of the cache file to read
 * @template T - The type of data stored in the cache file
 * @returns {Promise<T>} A promise that resolves to the parsed cache data of type T, or undefined if the file doesn't exist
 */
export async function readCache<T>(name: string): Promise<T | undefined> {
  const filePath = path.join(getCacheFolder(), name);

  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  const data = await fs.readFile(filePath, "utf-8");

  return JSON.parse(data) as T;
}

export interface FetchCacheOptions<TData = unknown> {
  /**
   * Unique key to identify the cache entry
   */
  cacheKey: string;

  /**
   * Parser function to parse the fetched data
   * @param {string} data - The fetched data to parse
   * @template TData
   * @returns {TData} The parsed data
   */
  parser: (data: string) => TData;

  /**
   * Options to pass to the fetch request
   */
  options?: RequestInit;

  /**
   * Bypass the cache and fetch fresh data
   */
  bypassCache?: boolean;
}

/**
 * Fetches data from a URL with caching support.
 *
 * @param {string} url - The URL to fetch data from
 * @param {FetchCacheOptions} options - Configuration options for the fetch request and caching
 * @template TData - The type of data returned after parsing
 *
 * @returns {Promise<TData>} Promise that resolves with the parsed data (either from cache or freshly fetched)
 *
 * @throws {Error} When the fetch request fails
 */
export async function fetchCache<TData = unknown>(
  url: string,
  options: FetchCacheOptions<TData>,
): Promise<TData> {
  const { cacheKey, parser, bypassCache, options: fetchOptions } = options;
  const cache = LOCAL_CACHE.get(cacheKey) ?? await readCache<TData>(cacheKey);

  if (!bypassCache && cache != null) {
    // eslint-disable-next-line no-console
    console.debug(`cache hit: ${cacheKey}`);
    LOCAL_CACHE.set(cacheKey, cache);

    return cache as TData;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.text();

  const parsedData = parser(data);

  LOCAL_CACHE.set(cacheKey, parsedData);
  await writeCache(cacheKey, parsedData);

  return parsedData;
}
