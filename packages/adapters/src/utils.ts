import type { UrlBuilder } from "./types";

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
