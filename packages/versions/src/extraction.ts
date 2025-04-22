import mojiCompare from "@mojis/moji-compare";
import { MAPPED_EMOJI_VERSIONS } from "./constants";

/**
 * Extracts the emoji version from a comment string.
 * The version should be in the format "E{major}.{minor}" (e.g. "E14.0").
 *
 * @param {string} comment - The comment string to extract the version from
 * @returns {string | null} The parsed version number, or null if no valid version was found
 *
 * @example
 * ```ts
 * extractEmojiVersion("E14.0") // returns "14.0"
 * extractEmojiVersion("Something else") // returns null
 * ```
 */
export function extractEmojiVersion(comment: string): string | null {
  const version = comment.match(/E(\d+\.\d)/);

  if (version != null && version[1] != null) {
    return version[1].trim();
  }

  return null;
}

/**
 * Extracts the Unicode version number from a given text string.
 *
 * @param {string?} text - The text to extract the version number from
 * @returns {string | null} The extracted version number as a string, or null if no version number is found
 *
 * @example
 * ```ts
 * extractVersionFromReadme("Version 15.0.0 of the Unicode Standard") // Returns "15.0.0"
 * extractVersionFromReadme("Unicode15.1") // Returns "15.1"
 * extractVersionFromReadme("No version here") // Returns null
 * ```
 */
export function extractVersionFromReadme(text?: string): string | null {
  if (text == null) return null;

  const patterns = [
    /Version (\d+\.\d+(?:\.\d+)?) of the Unicode Standard/, // Most explicit
    /Unicode(\d+\.\d+(?:\.\d+)?)/, // From URLs
    /Version (\d+\.\d+)(?!\.\d)/, // Bare major.minor format
    /Unicode Emoji, Version (\d+\.\d+(?:\.\d+)?)/, // Emoji-specific version
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match == null || match[1] == null) continue;

    return match[1];
  }

  return null;
}

/**
 * Extracts and aligns the Unicode version based on the provided emoji version.
 *
 * For emoji versions 11.0.0 and above, it compares the emoji version with the Unicode version (if provided)
 * and returns the smaller of the two. If no Unicode version is provided, it returns the emoji version.
 *
 * For emoji versions prior to 11.0.0, it uses a mapping to determine the corresponding Unicode version.
 *
 * @param {string | null} emojiVersion - The emoji version string (e.g., "1.0", "12.0"). Can be null.
 * @param {string?} unicodeVersion - The Unicode version string (e.g., "8.0", "13.0"). Optional.
 * @returns {string | null} The aligned Unicode version string or null if the emoji version is null or invalid.
 * Returns "6.0" if the emoji version is not found in the version map and is less than 11.0.0.
 */
export function extractUnicodeVersion(emojiVersion: string | null, unicodeVersion?: string): string | null {
  // handle null case early
  if (emojiVersion == null) {
    return null;
  }

  const coercedEmojiVersion = mojiCompare.coerce(emojiVersion);

  // early return if emoji version is invalid
  if (coercedEmojiVersion == null) {
    return null;
  }

  // v11+ aligned emoji and unicode specs (except for minor versions)
  if (mojiCompare.gte(coercedEmojiVersion, "11.0.0")) {
    // if Unicode version is not provided, return the emoji version
    if (unicodeVersion == null) {
      return emojiVersion;
    }

    const coercedUnicodeVersion = mojiCompare.coerce(unicodeVersion);

    // if Unicode version is invalid, return emoji version
    if (coercedUnicodeVersion == null) {
      return emojiVersion;
    }

    // return the smaller version between emoji and unicode version
    return mojiCompare.lt(coercedEmojiVersion, coercedUnicodeVersion) ? emojiVersion : unicodeVersion;
  }

  // return mapped version or default to "6.0"
  return MAPPED_EMOJI_VERSIONS[emojiVersion] || "6.0";
}
