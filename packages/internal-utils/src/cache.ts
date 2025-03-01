import path from "node:path";
import process from "node:process";
import fs from "fs-extra";

const CACHE_DIR = path.resolve(process.cwd(), ".cache");

export interface CacheMeta {
  encoding?: BufferEncoding | null;
  ttl: number;
}

export interface WriteCacheOptions<TData> {
  /**
   * The folder to write the cache file to
   * @default "<cwd>/.cache"
   */
  cacheFolder?: string;

  /**
   * The encoding of the cache file
   * @default "utf-8"
   */
  encoding?: BufferEncoding | null;

  /**
   * Time-to-live of the cache file in seconds
   * @default -1 (never expires)
   */
  ttl?: number;

  /**
   * Transform data before caching
   * @param {TData} data - The data to transform
   * @returns {TData} The transformed data
   */
  transform?: (data: TData) => TData;
}

/**
 * Writes data to a cache file.
 *
 * @param {string} cacheKey - The cacheKey of the cache file to write to
 * @param {TData} data - The data to write to the cache file
 * @param {WriteCacheOptions} options - Configuration options for writing the cache file
 * @template TData - The type of data being cached
 * @returns {Promise<TData>} A promise that resolves with the cached data
 */
export async function writeCache<TData extends string | Uint8Array>(cacheKey: string, data: TData, options?: WriteCacheOptions<TData>): Promise<TData> {
  const filePath = path.join(options?.cacheFolder ?? CACHE_DIR, cacheKey);

  await fs.ensureDir(path.dirname(filePath));

  if (options?.transform) {
    data = options.transform(data);
  }

  const encoding = options?.encoding === null ? undefined : options?.encoding ?? "utf-8";

  await fs.writeFile(filePath, data, encoding);

  let ttl = -1;

  if (options?.ttl) {
    const date = new Date();
    date.setSeconds(date.getSeconds() + options.ttl);
    ttl = date.getTime();
  }

  await fs.writeFile(`${filePath}.meta`, JSON.stringify({
    encoding,
    ttl,
  } satisfies CacheMeta), "utf-8");

  return data;
}

/**
 * Reads and returns the cache metadata for a given cache key.
 *
 * @param {string} cacheKey - The unique identifier for the cache entry
 * @param {string?} cacheFolder - The directory where cache data is stored (defaults to CACHE_DIR)
 * @returns {Promise<CacheMeta | undefined>} A promise that resolves to the parsed CacheMeta object, or undefined if the metadata file doesn't exist
 * @throws {Error} If the metadata file exists but cannot be read or parsed
 */
export async function readCacheMeta(cacheKey: string, cacheFolder: string = CACHE_DIR): Promise<CacheMeta | undefined> {
  const filePath = path.join(cacheFolder, `${cacheKey}.meta`);

  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  const data = await fs.readFile(filePath, "utf-8");

  return JSON.parse(data) as CacheMeta;
}

/**
 * Reads and parses JSON data from a cache file.
 *
 * @param {string} name - The name of the cache file to read
 * @param {(data: TData) => TData} transform - A function to transform the cache data before returning it
 * @param {string?} cacheFolder - The directory where cache data is stored (defaults to CACHE_DIR)
 * @template TData - The type of data stored in the cache file
 * @returns {Promise<T>} A promise that resolves to the parsed cache data of type T, or undefined if the file doesn't exist
 */
export async function readCache<TData extends string | Uint8Array>(name: string, transform?: (data: TData) => TData, cacheFolder: string = CACHE_DIR): Promise<TData | undefined> {
  const filePath = path.join(cacheFolder, name);

  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  // read metadata
  const meta = await readCacheMeta(name, cacheFolder);

  if (!meta) {
    return undefined;
  }

  if (meta.ttl !== -1 && Date.now() > meta.ttl) {
    // delete cache if expired
    await Promise.all([
      fs.remove(filePath),
      fs.remove(`${filePath}.meta`),
    ]);
    return undefined;
  }

  const data = await fs.readFile(filePath, meta.encoding);

  if (transform) {
    return transform(data as TData);
  }

  return data as TData;
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
 * Fetches data from a URL and caches it, or retrieves it from the cache if it exists.
 *
 * @param {string} url - The URL to fetch data from
 * @param {FetchCacheOptions<TData>} options - Configuration options for fetching and caching
 * @template TData - The type of data being fetched and cached
 * @returns {Promise<TData>} A promise that resolves with the fetched and parsed data
 */
export async function fetchCache<TData>(url: string, options: FetchCacheOptions<TData> & Omit<WriteCacheOptions<string>, "transform">): Promise<TData> {
  const { cacheKey, parser, options: fetchOptions, bypassCache, ...cacheOptions } = options;

  if (!bypassCache) {
    const cachedData = await readCache<string>(cacheKey, undefined, cacheOptions.cacheFolder);

    if (cachedData) {
      return parser(cachedData);
    }
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`failed to fetch: url=(${url}) status=(${response.status})`);
  }

  const data = await response.text();
  const parsedData = parser(data);

  await writeCache(cacheKey, data, cacheOptions as WriteCacheOptions<string>);

  return parsedData;
}
