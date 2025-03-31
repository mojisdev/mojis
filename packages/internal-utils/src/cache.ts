import path from "node:path";
import process from "node:process";
import fs from "fs-extra";

export interface CacheMeta {
  encoding?: BufferEncoding | null;
  ttl: number;
}

export interface CacheOptions {
  /**
   * Time-to-live of the cache entry in seconds
   * @default -1 (never expires)
   */
  ttl?: number;
}

export interface CacheEntry<TData> {
  data: TData;
  meta: CacheMeta;
}

export interface CacheStore<TData> {
  /**
   * Get a value from the cache
   */
  get: (key: string) => Promise<CacheEntry<TData> | undefined>;

  /**
   * Set a value in the cache
   */
  set: (key: string, entry: CacheEntry<TData>) => Promise<void>;

  /**
   * Delete a value from the cache
   */
  delete: (key: string) => Promise<void>;

  /**
   * Clear all values from the cache
   */
  clear: () => Promise<void>;
}

/**
 * In-memory cache implementation
 */
export class MemoryCacheStore<TData> implements CacheStore<TData> {
  private store = new Map<string, CacheEntry<TData>>();

  async get(key: string): Promise<CacheEntry<TData> | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.meta.ttl !== -1 && Date.now() > entry.meta.ttl) {
      await this.delete(key);
      return undefined;
    }

    return entry;
  }

  async set(key: string, entry: CacheEntry<TData>): Promise<void> {
    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Filesystem cache implementation
 */
export class FileSystemCacheStore<TData extends string | Uint8Array> implements CacheStore<TData> {
  constructor(private readonly cacheDir: string = path.resolve(process.cwd(), ".cache")) { }

  private getFilePath(key: string): string {
    return path.join(this.cacheDir, key);
  }

  private getMetaFilePath(key: string): string {
    return `${this.getFilePath(key)}.meta`;
  }

  async get(key: string): Promise<CacheEntry<TData> | undefined> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaFilePath(key);

    try {
      if (!(await fs.pathExists(filePath)) || !(await fs.pathExists(metaPath))) {
        return undefined;
      }

      const metaData = await fs.readFile(metaPath, "utf-8");
      const meta = JSON.parse(metaData) as CacheMeta;

      if (meta.ttl !== -1 && Date.now() > meta.ttl) {
        await this.delete(key);
        return undefined;
      }

      const data = await fs.readFile(filePath, meta.encoding);
      return {
        data: data as TData,
        meta,
      };
    } catch {
      return undefined;
    }
  }

  async set(key: string, entry: CacheEntry<TData>): Promise<void> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaFilePath(key);

    await fs.ensureDir(path.dirname(filePath));

    await Promise.all([
      fs.writeFile(filePath, entry.data, entry.meta.encoding),
      fs.writeFile(metaPath, JSON.stringify(entry.meta), "utf-8"),
    ]);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const metaPath = this.getMetaFilePath(key);

    await Promise.all([
      fs.remove(filePath),
      fs.remove(metaPath),
    ]);
  }

  async clear(): Promise<void> {
    await fs.remove(this.cacheDir);
    await fs.ensureDir(this.cacheDir);
  }
}

export interface Cache<TData> {
  /**
   * Get a value from the cache
   */
  get: (key: string) => Promise<TData | undefined>;

  /**
   * Set a value in the cache
   */
  set: (key: string, data: TData, options?: CacheOptions) => Promise<void>;

  /**
   * Delete a value from the cache
   */
  delete: (key: string) => Promise<void>;

  /**
   * Clear all values from the cache
   */
  clear: () => Promise<void>;
}

export class CacheImpl<TData> implements Cache<TData> {
  constructor(
    private readonly store: CacheStore<TData>,
    private readonly encoding: BufferEncoding | null = "utf-8",
  ) { }

  async get(key: string): Promise<TData | undefined> {
    const entry = await this.store.get(key);
    return entry?.data;
  }

  async set(key: string, data: TData, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ? new Date(Date.now() + options.ttl * 1000).getTime() : -1;

    await this.store.set(key, {
      data,
      meta: {
        encoding: this.encoding,
        ttl,
      },
    });
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }
}

export interface CreateCacheOptions {
  store?: "memory" | "filesystem";
  cacheDir?: string;
  encoding?: BufferEncoding | null;
}

/**
 * Creates a new cache instance
 * @param {CreateCacheOptions} options Configuration options for the cache
 * @returns A new cache instance
 */
export function createCache<TData extends string | Uint8Array>(options: CreateCacheOptions = {}): Cache<TData> {
  const { store = "filesystem", cacheDir, encoding } = options;

  const cacheStore: CacheStore<TData> = store === "memory"
    ? new MemoryCacheStore<TData>()
    : new FileSystemCacheStore<TData>(cacheDir);

  return new CacheImpl<TData>(cacheStore, encoding);
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

  /**
   * Cache options
   */
  cacheOptions?: CacheOptions;

  /**
   * Cache instance to use. If not provided, a new filesystem cache will be created.
   */
  cache?: Cache<string>;
}

/**
 * Fetches data from a URL and caches it, or retrieves it from the cache if it exists.
 */
export async function fetchCache<TData>(
  url: string,
  options: FetchCacheOptions<TData>,
): Promise<TData> {
  const { cacheKey, parser, options: fetchOptions, bypassCache, cacheOptions } = options;
  const cache = options.cache ?? createCache<string>({ store: "filesystem" });

  if (!bypassCache) {
    const cachedData = await cache.get(cacheKey);
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

  await cache.set(cacheKey, data, cacheOptions);

  return parsedData;
}

/**
 * Creates a cache key from a URL by replacing all file system unfriendly characters with underscores.
 */
export function createCacheKeyFromUrl(url: string): string {
  const _url = new URL(url);
  return (_url.hostname + _url.pathname)
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]/gi, "_");
}
