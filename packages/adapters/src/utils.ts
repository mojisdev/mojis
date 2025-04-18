import type { UrlFn } from "./builders/source-transformer-builder/types";
import type { AdapterContext, BuiltinParser, JoinPaths, PossibleUrls, UrlWithCache } from "./global-types";
import path from "node:path";
import { createCacheKeyFromUrl } from "@mojis/internal-utils";

/**
 * Type guard to check if a value is a UrlWithCache object.
 *
 * A UrlWithCache object must be a non-null object with 'url' and 'cacheKey' properties.
 *
 * @param {unknown} url - The value to check
 * @returns {boolean} True if the value is a UrlWithCache object, false otherwise
 *
 * @example
 * ```ts
 * const url = { url: "https://example.com", cacheKey: "example" };
 * if (isUrlWithCache(url)) {
 *   // url is typed as UrlWithCache
 * }
 * ```
 */
export function isUrlWithCache(url: unknown): url is UrlWithCache {
  return typeof url === "object" && url !== null && "url" in url && "cacheKey" in url;
}

/**
 * Creates a URL object with associated cache key.
 *
 * @param {string} url - The URL string.
 * @returns {UrlWithCache} An object containing the original URL, a cache key derived from the URL, and the cache key itself (aliased as 'key').
 */
function createUrlWithCache(url: string): UrlWithCache {
  const cacheKey = createCacheKeyFromUrl(url);
  return { url, cacheKey, key: cacheKey };
}

export const BUILTIN_PARSERS = [
  "generic",
] as const;

/**
 * Checks if the given parser is a builtin parser.
 *
 * A builtin parser is a string that corresponds to a key in the BUILTIN_PARSERS object.
 *
 * @param {unknown} parser - The parser to check
 * @returns {boolean} True if the parser is a builtin parser, false otherwise
 */
export function isBuiltinParser(parser: unknown): parser is BuiltinParser {
  return typeof parser === "string" && BUILTIN_PARSERS.includes(parser as BuiltinParser);
}

/**
 * Gets the URLs for a handler by executing the URL function with the provided context.
 * Ensures all URLs have valid key and cacheKey properties.
 *
 * @param {UrlFn<PossibleUrls>} urls - A function that returns URL(s) with cache configuration
 * @param {TContext} ctx - The adapter context to pass to the URL function
 * @returns {Promise<UrlWithCache[]>} A promise that resolves to an array of URL objects with cache configuration
 *
 * @template {AdapterContext} TContext - The type of the adapter context
 *
 * @example
 * ```ts
 * const urls = (ctx) => ({
 *   url: "https://example.com",
 *   cacheKey: "example"
 * });
 *
 * const result = await getHandlerUrls(urls, context);
 * // Returns: [{url: "https://example.com", cacheKey: "example", key: "example"}]
 * ```
 */
export async function getHandlerUrls<TContext extends AdapterContext>(
  urls: UrlFn<PossibleUrls>,
  ctx: TContext,
): Promise<UrlWithCache[]> {
  if (urls == null) {
    return [];
  }

  if (typeof urls !== "function") {
    return [];
  }

  const urlsResults = urls(ctx);

  if (urlsResults == null) {
    return [];
  }

  const result = Array.isArray(urlsResults) ? urlsResults : [urlsResults];

  return result.filter((url) => url != null).map((url) => {
    if (typeof url === "string") {
      return createUrlWithCache(url);
    }

    // generate cacheKey if not provided
    if (!("cacheKey" in url) || typeof url.cacheKey !== "string" || url.cacheKey == null) {
      url.cacheKey = createCacheKeyFromUrl(url.url);
    }

    // generate key if not provided
    // use cacheKey as key, if provided
    if (!("key" in url) || typeof url.key !== "string" || url.key == null) {
      url.key = url.cacheKey;
    }

    return url;
  });
}

/**
 * Builds a new context object by merging the properties of the original context with additional properties.
 *
 * @param {TContext} ctx - The original context object.
 * @param {TExtraContext} extraContext - An object containing additional properties to be added to the context.
 * @returns {TContext & TExtraContext} A new context object that is the result of merging the original context with the extra context.
 *
 * @template {AdapterContext} TContext - The type of the original context object
 * @template {Record<string, unknown>} TExtraContext - The type of the additional context object
 */
export function buildContext<TContext extends AdapterContext, TExtraContext extends Record<string, unknown>>(
  ctx: TContext,
  extraContext: TExtraContext,
): TContext & TExtraContext {
  return Object.assign({}, ctx, extraContext);
}

/**
 * Type-safe path join function that preserves string literal types in the output
 * when string literals are provided as input.
 *
 * @param segments - Path segments to join
 * @returns Joined path with preserved literal type information when possible
 */
export function joinPath<Parts extends readonly string[]>(...segments: Parts): JoinPaths<Parts> {
  // The actual implementation uses path.join but the return type is our literal type
  return path.join(...segments) as JoinPaths<Parts>;
}
