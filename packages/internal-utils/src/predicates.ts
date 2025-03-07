import semver from "semver";

/**
 * Checks if a version is less than "13.0.0".
 *
 * @param {string} version - The version string to check
 * @returns {boolean} `true` if the version is less than "11.0.0", `false` otherwise
 */
export function isBeforeAlignment(version: string): boolean {
  if (version == null) {
    return false;
  }

  const coerced = semver.coerce(version);
  if (coerced == null) {
    return false;
  }

  return coerced.major < 13;
}
