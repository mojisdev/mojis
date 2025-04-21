import mojiCompare from "@mojis/moji-compare";
import { MAPPED_EMOJI_VERSIONS } from "./constants";

/**
 * Maps an emoji version to its corresponding Unicode version.
 *
 * @param {string} emojiVersion - The emoji version to map to a Unicode version
 * @returns {string} The corresponding Unicode version if found, otherwise returns the input version
 */
export function mapEmojiVersionToUnicodeVersion(emojiVersion: string): string {
  const mapped = MAPPED_EMOJI_VERSIONS[emojiVersion];

  if (mapped != null) {
    return mapped;
  }

  return emojiVersion;
}

/**
 * Converts a version string to a semver compatible version.
 *
 * @param {string} version - The version string to convert
 * @returns {string | null} The semver compatible version string or null if the version cannot be coerced
 *
 * NOTE:
 * Emoji Versions is almost always major.minor format.
 */
export function toSemverCompatible(version: string): string | null {
  return mojiCompare.coerce(version) || null;
}
