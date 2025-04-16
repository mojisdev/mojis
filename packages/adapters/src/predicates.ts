import type { PredicateFn } from "./builders/source-builder/types";
import mojiCompare from "@mojis/moji-compare";

/**
 * A predicate function that always returns true regardless of version.
 */
export const always: PredicateFn = () => true;

/**
 * A predicate function that always returns false regardless of version.
 */
export const never: PredicateFn = () => false;

/**
 * Creates a predicate that matches versions greater than the specified version.
 * @param {string} version - The version to compare against
 * @returns {PredicateFn} A predicate function that matches when version > specified
 */
export function greaterThan(version: string): PredicateFn {
  return (emoji_version) => mojiCompare.gt(emoji_version, version);
}

/**
 * Creates a predicate that matches versions less than the specified version.
 * @param {string} version - The version to compare against
 * @returns {PredicateFn} A predicate function that matches when version < specified
 */
export function lessThan(version: string): PredicateFn {
  return (emoji_version) => mojiCompare.lt(emoji_version, version);
}

/**
 * Creates a predicate that matches specific versions from a list.
 * @param {string[]} versions Array of versions to match
 * @returns {PredicateFn} A predicate function that matches when version is in the list
 */
export function matchVersions(versions: string[]): PredicateFn {
  return (version) => versions.includes(version);
}

/**
 * Creates a predicate that matches versions within a range (inclusive).
 * @param {string} min Minimum version (inclusive)
 * @param {string} max Maximum version (inclusive)
 * @returns {PredicateFn} A predicate function that matches versions between min and max
 */
export function between(min: string, max: string): PredicateFn {
  return (version) =>
    (version === min || mojiCompare.gt(version, min))
    && (version === max || mojiCompare.gt(max, version));
}

/**
 * Creates a predicate by combining multiple predicates with logical AND.
 * @param {PredicateFn[]} predicates Array of predicates to combine
 * @returns {PredicateFn} A predicate function that matches when all predicates match
 */
export function all(...predicates: PredicateFn[]): PredicateFn {
  return (version) => predicates.every((predicate) => predicate(version));
}

/**
 * Creates a predicate by combining multiple predicates with logical OR.
 * @param {PredicateFn[]} predicates Array of predicates to combine
 * @returns {PredicateFn} A predicate function that matches when any predicate matches
 */
export function any(...predicates: PredicateFn[]): PredicateFn {
  return (version) => predicates.some((predicate) => predicate(version));
}

/**
 * Creates a predicate that excludes specific versions.
 * @param {string[]} versions Array of versions to exclude
 * @returns {PredicateFn} A predicate function that matches when version is not in the list
 */
export function excludeVersions(versions: string[]): PredicateFn {
  return (version) => !versions.includes(version);
}
