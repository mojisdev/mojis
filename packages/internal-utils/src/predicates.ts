import semver from "semver";

/**
 * Checks if a version is less than "11.0.0".
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

  return coerced.major < 11;
}

/**
 * Checks if the given version is after the alignment.
 * It is the inverse of `isBeforeAlignment`.
 *
 * @param {string} version - The version string to check
 * @returns {boolean} `true` if the version is after alignment, `false` otherwise
 */
export function isAfterAlignment(version: string): boolean {
  return !isBeforeAlignment(version);
}

/**
 * Checks if a version string is before a target version using semantic versioning.
 *
 * @param {string} version - The version string to check.
 * @param {string} target - The target version string to compare against.
 * @returns {boolean} `true` if the version is before the target, `false` otherwise.  Also returns `false` if the version is null or cannot be coerced into a semantic version.
 */
export function isBefore(version: string, target: string): boolean {
  if (version == null) {
    return false;
  }

  const coercedVersion = semver.coerce(version);
  if (coercedVersion == null) {
    return false;
  }

  const coercedTarget = semver.coerce(target);
  if (coercedTarget == null) {
    return false;
  }

  return semver.lt(coercedVersion, coercedTarget);
}
