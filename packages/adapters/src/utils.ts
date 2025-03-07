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
      return typeof urlsResults === "string"
        ? [{
            url: urlsResults,
            cacheKey: createCacheKeyFromUrl(urlsResults),
          }]
        : [urlsResults];
    }

    return urlsResults
      .filter((url) => url != null)
      .map((url) =>
        typeof url === "string"
          ? { url, cacheKey: createCacheKeyFromUrl(url) }
          : url,
      );
  }

  if (Array.isArray(urls)) {
    for (const url of urls) {
      if (url != null) {
        result.push(
          typeof url === "string"
            ? { url, cacheKey: createCacheKeyFromUrl(url) }
            : url,
        );
      }
    }
    return result;
  }

  return typeof urls === "string"
    ? [{ url: urls, cacheKey: createCacheKeyFromUrl(urls) }]
    : [urls];
}
