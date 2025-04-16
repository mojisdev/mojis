import type { PredicateFn } from "./builders/source-builder/types";
import mojiCompare from "@mojis/moji-compare";

/**
 * A predicate function that takes a version string and returns a boolean.
 */
export const alwaysTrue: PredicateFn = () => true;

/**
 * A predicate function that takes a version string and returns false.
 */
export const alwaysFalse: PredicateFn = () => false;

/**
 * Creates a predicate function that returns true only if the emoji version is greater than the specified version.
 * @param {string} version - The version to compare against
 * @returns {PredicateFn} A predicate function that takes an emoji version and returns true if the emoji version is greater than the specified version
 */
export function onlyGreaterThan(version: string): PredicateFn {
  return (emoji_version) => mojiCompare.gt(emoji_version, version);
}

/**
 * Creates a predicate function that returns true only if the emoji version is less than the specified version.
 * @param version - The version to compare against
 * @returns {PredicateFn} A predicate function that takes an emoji version and returns true if the emoji version is less than the specified version
 */
export function onlyLessThan(version: string): PredicateFn {
  return (emoji_version) => mojiCompare.lt(version, emoji_version);
}

/**
 * Creates a predicate that only includes specific versions
 * @param {string[]} allowedVersions Array of versions to include
 * @returns {PredicateFn} A predicate function that returns true only for versions in the list
 */
export function onlyVersions(allowedVersions: string[]): PredicateFn {
  return (version) => allowedVersions.includes(version);
}

/**
 * Creates a predicate that includes versions within a range (inclusive)
 * @param {string} minVersion Minimum version (inclusive)
 * @param {string} maxVersion Maximum version (inclusive)
 * @returns {PredicateFn} A predicate function that returns true for versions within the range
 */
export function versionRange(minVersion: string, maxVersion: string): PredicateFn {
  return (version) =>
    (version === minVersion || mojiCompare.gt(version, minVersion))
    && (version === maxVersion || mojiCompare.gt(maxVersion, version));
}

/**
 * Creates a predicate that combines multiple predicates with logical AND
 * @param {PredicateFn[]} predicates Array of predicates to combine
 * @returns {PredicateFn} A predicate function that returns true only if all predicates return true
 */
export function and(...predicates: PredicateFn[]): PredicateFn {
  return (version) => predicates.every((predicate) => predicate(version));
}

/**
 * Creates a predicate that combines multiple predicates with logical OR
 * @param {PredicateFn[]} predicates Array of predicates to combine
 * @returns {PredicateFn} A predicate function that returns true if any predicate returns true
 */
export function or(...predicates: PredicateFn[]): PredicateFn {
  return (version) => predicates.some((predicate) => predicate(version));
}
