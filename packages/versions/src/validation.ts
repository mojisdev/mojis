import mojiCompare from "@mojis/moji-compare";
import { NON_EXISTING_VERSIONS } from "./constants";

/**
 * Checks if a given emoji version is allowed based on specific criteria.
 *
 * Due to Unicode Consortium's versioning changes in 2017:
 * - Versions 6-10 don't exist (they aligned emoji versions with Unicode versions)
 * - Versions 1-5 only had major releases (no minor or patch versions)
 *
 * @param {string} version - The emoji version string to check.
 * @returns {boolean} A boolean that resolves true if the version is allowed, false otherwise.
 */
export function isEmojiVersionAllowed(version: string): boolean {
  const semverVersion = mojiCompare.coerce(version);
  if (semverVersion == null) {
    return false;
  }

  // There isn't any Emoji 6.0-10.0. They aligned the emoji version with the unicode version in 2017.
  // Starting from v11.0.
  if (NON_EXISTING_VERSIONS.find((v) => mojiCompare.satisfies(semverVersion, v))) {
    return false;
  }

  // from v1 to v5, there was only major releases. So no v1.1, v1.2, etc.
  // only, v1.0, v2.0, v3.0, v4.0, v5.0.
  // if version has any minor or patch, it is invalid.
  if (mojiCompare.major(semverVersion) <= 5 && (mojiCompare.minor(semverVersion) !== 0 || mojiCompare.patch(semverVersion) !== 0)) {
    return false;
  }

  return true;
}
