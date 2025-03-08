import type { AdapterContext, Arrayable, BuiltinParser, UrlBuilder, UrlWithCache } from "./types";
import { createCacheKeyFromUrl } from "@mojis/internal-utils";

/**
 * Type predicate function that checks if the given value is a UrlBuilder.
 *
 * A UrlBuilder is expected to be a callable function.
 *
 * @param {unknown} fn - The value to check
 * @returns {boolean} True if the value is a function (and thus potentially a UrlBuilder), false otherwise
 */
export function isUrlBuilder(fn: unknown): fn is UrlBuilder {
  return typeof fn === "function";
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
 * Creates a URL object with associated cache key.
 *
 * @param {string} url - The URL string.
 * @returns {UrlWithCache} An object containing the original URL, a cache key derived from the URL, and the cache key itself (aliased as 'key').
 */
function createUrlWithCache(url: string): UrlWithCache {
  const cacheKey = createCacheKeyFromUrl(url);
  return { url, cacheKey, key: cacheKey };
}

/**
 * Processes various URL formats into a standardized array of URL objects with cache keys.
 *
 * This utility function handles multiple input formats:
 * - Single string URL
 * - Array of string URLs
 * - URL object with cache information
 * - Array of URL objects
 * - URL builder function that returns URLs based on context
 * - Null/undefined values (returns empty array)
 *
 * @param {Arrayable<string> | Arrayable<undefined> | Arrayable<UrlWithCache> | UrlBuilder} urls - The URL(s) to process, which can be:
 *               - A single string URL
 *               - An array of string URLs
 *               - A single {@link UrlWithCache} object
 *               - An array of {@link UrlWithCache} objects
 *               - A {@link UrlBuilder} function that generates URLs from context
 *               - null or undefined (returns empty array)
 * @param {TContext} ctx - The adapter context object used when resolving URL builder functions
 * @returns {Promise<UrlWithCache[]>} A promise that resolves to an array of {@link UrlWithCache} objects with normalized structure
 *
 * @template TContext - The type of context passed to URL builder functions
 */
export async function getHandlerUrls<TContext extends AdapterContext>(
  urls: Arrayable<string> | Arrayable<undefined> | Arrayable<UrlWithCache> | UrlBuilder,
  ctx: TContext,
): Promise<UrlWithCache[]> {
  const result: UrlWithCache[] = [];

  if (urls == null) {
    return result;
  }

  if (isUrlBuilder(urls)) {
    const urlsResults = await urls(ctx);

    if (urlsResults == null) {
      return result;
    }

    if (!Array.isArray(urlsResults)) {
      if (typeof urlsResults === "string") {
        return [createUrlWithCache(urlsResults)];
      }

      return [urlsResults];
    }

    return urlsResults
      .filter((url) => url != null)
      .map((url) => typeof url === "string" ? createUrlWithCache(url) : url);
  }

  if (Array.isArray(urls)) {
    for (const url of urls) {
      if (url != null) {
        result.push(typeof url === "string" ? createUrlWithCache(url) : url);
      }
    }
    return result;
  }

  if (typeof urls === "string") {
    return [createUrlWithCache(urls)];
  }

  return [urls];
}
