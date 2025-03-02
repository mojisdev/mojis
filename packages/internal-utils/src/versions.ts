import type { z } from "zod";
import type { EMOJI_VERSION_SCHEMA } from "./schemas";
import semver from "semver";
import { NON_EXISTING_VERSIONS } from "./constants";

export const MAPPED_EMOJI_VERSIONS: Record<string, string> = {
  "1.0": "8.0",
  "2.0": "8.0",
  "3.0": "9.0",
  "4.0": "9.0",
  "5.0": "10.0",

  // There doesn't seem to be a Unicode 13.1, so we'll map it to 13.0
  "13.1": "13.0",
};

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
  return semver.coerce(version)?.version || null;
}

// TODO: find a better name for this type, when the schema has been changed
export type EmojiVersion = z.infer<typeof EMOJI_VERSION_SCHEMA>;

export interface DraftVersion {
  emoji_version: string;
  unicode_version: string;
}

/**
 * Retrieves the current Unicode draft version by fetching and comparing root and emoji ReadMe files.
 *
 * This function fetches two ReadMe files from unicode.org:
 * - The main draft ReadMe
 * - The emoji draft ReadMe
 *
 * It then extracts and validates the version numbers from both files to ensure they match.
 * The emoji version uses major.minor format while the root version uses major.minor.patch.
 *
 * @returns {Promise<DraftVersion | null>} A Promise that resolves to the current draft version string, or null if not found
 */
export async function getCurrentDraftVersion(): Promise<DraftVersion | null> {
  try {
    const [draftText, emojiText] = await Promise.all([
      "https://unicode.org/Public/draft/ReadMe.txt",
      "https://unicode.org/Public/draft/emoji/ReadMe.txt",
    ].map(async (url) => {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`failed to fetch ${url}: ${res.statusText}`);
      }

      return res.text();
    }));

    const rootVersion = extractVersionFromReadme(draftText);
    const emojiVersion = extractVersionFromReadme(emojiText);

    if (rootVersion == null || emojiVersion == null) {
      throw new Error("failed to extract draft version");
    }

    // the emoji version is only using major.minor format.
    // so, we will need to add the last 0 to the version.
    // if they don't match the major and minor version, we will throw an error.
    if (semver.major(rootVersion) !== semver.major(`${emojiVersion}.0`) || semver.minor(rootVersion) !== semver.minor(`${emojiVersion}.0`)) {
      throw new Error("draft versions do not match");
    }

    return {
      emoji_version: emojiVersion,
      unicode_version: rootVersion,
    };
  } catch {
    return null;
  }
}

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

// https://unicode.org/reports/tr51/#EmojiVersions
export function extractUnicodeVersion(emojiVersion: string | null, unicodeVersion?: string): string | null {
  const coercedEmojiVersion = semver.coerce(emojiVersion);
  const coercedUnicodeVersion = semver.coerce(unicodeVersion);

  if (coercedEmojiVersion == null || coercedUnicodeVersion == null) {
    return null;
  }

  // v11+ aligned emoji and unicode specs (except for minor versions)
  if (semver.gte(coercedEmojiVersion, "11.0.0")) {
    // if the unicode version is not provided, we will return the emoji version.
    if (unicodeVersion == null) {
      return emojiVersion;
    }

    // return the smallest version between the emoji and unicode version.
    if (semver.lt(coercedEmojiVersion, coercedUnicodeVersion)) {
      return emojiVersion;
    }

    return unicodeVersion;
  }

  switch (emojiVersion) {
    case "0.7":
      return "7.0";
    case "1.0":
    case "2.0":
      return "8.0";
    case "3.0":
    case "4.0":
      return "9.0";
    case "5.0":
      return "10.0";
    default:
      // v6 is the first unicode spec emojis appeared in
      return "6.0";
  }
}

/**
 * Retrieves all available emoji versions from Unicode.org.
 * This function fetches both the root Unicode directory and the emoji-specific directory
 * to compile a comprehensive list of valid emoji versions.
 *
 * The function performs the following steps:
 * 1. Fetches content from Unicode.org's public directories
 * 2. Extracts version numbers using regex
 * 3. Validates each version
 * 4. Normalizes version numbers to valid semver format
 *
 * @throws {Error} When either the root or emoji page fetch fails
 * @returns {Promise<EmojiVersion[]>} A promise that resolves to an array of emoji versions,
 *                             sorted according to semver rules
 */
export async function getAllEmojiVersions(): Promise<EmojiVersion[]> {
  const [rootResult, emojiResult] = await Promise.allSettled([
    "https://unicode.org/Public/",
    "https://unicode.org/Public/emoji/",
  ].map(async (url) => {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`failed to fetch ${url}: ${res.statusText}`);
    }

    return res.text();
  }));

  if (rootResult == null || emojiResult == null) {
    throw new Error("failed to fetch root or emoji page");
  }

  if (rootResult.status === "rejected" || emojiResult.status === "rejected") {
    console.error({
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch root or emoji page");
  }

  const rootHtml = rootResult.value;
  const emojiHtml = emojiResult.value;

  const versionRegex = /href="(\d+\.\d+(?:\.\d+)?)\/?"/g;

  const draft = await getCurrentDraftVersion();

  if (draft == null) {
    throw new Error("failed to fetch draft version");
  }

  const versions: EmojiVersion[] = [];

  for (const match of rootHtml.matchAll(versionRegex)) {
    if (match == null || match[1] == null) continue;

    const version = match[1];

    if (!await isEmojiVersionValid(version)) {
      continue;
    }

    if (versions.some((v) => v.unicode_version === version)) {
      continue;
    }

    versions.push({
      emoji_version: version,
      unicode_version: version,
      draft: version === draft.unicode_version || version === draft.emoji_version,
    });
  }

  for (const match of emojiHtml.matchAll(versionRegex)) {
    if (match == null || match[1] == null) continue;

    let version = match[1];

    // for the emoji page, the versions is not valid semver.
    // so we will add the last 0 to the version.
    // handle both 5.0 and 12.0 -> 5.0.0 and 12.0.0
    if (version.length === 3 || version.length === 4) {
      version += ".0";
    }

    if (!await isEmojiVersionValid(version)) {
      continue;
    }

    // check if the unicode_version already exists.
    // if it does, we will update the emoji version.
    const existing = versions.find((v) => v.unicode_version === version);

    let unicode_version = null;

    // the emoji version 13.1 is using the unicode
    // 13.0, since it was never released.
    if (match[1] === "13.1") {
      unicode_version = "13.0.0";
    }

    if (match[1] === "5.0") {
      unicode_version = "10.0.0";
    }

    if (match[1] === "4.0" || match[1] === "3.0") {
      unicode_version = "9.0.0";
    }

    if (match[1] === "2.0" || match[1] === "1.0") {
      unicode_version = "8.0.0";
    }

    if (existing) {
      existing.unicode_version = unicode_version || existing.unicode_version;
      existing.emoji_version = match[1];
      continue;
    }

    versions.push({
      emoji_version: match[1],
      unicode_version: unicode_version || match[1],
      draft: version === draft.unicode_version || version === draft.emoji_version,
    });
  }

  return versions.sort((a, b) => semver.compare(`${b.emoji_version}.0`, `${a.emoji_version}.0`));
}

/**
 * Checks if the given emoji version is valid according to Unicode Consortium standards.
 *
 * Due to Unicode Consortium's versioning changes in 2017:
 * - Versions 6-10 don't exist (they aligned emoji versions with Unicode versions)
 * - Versions 1-5 only had major releases (no minor or patch versions)
 *
 * @param {string} version - The emoji version string to validate
 * @returns {Promise<boolean>} A promise that resolves to true if the version is valid, false otherwise
 *
 * @example
 * ```ts
 * await isEmojiVersionValid('11.0.0') // true
 * await isEmojiVersionValid('6.0.0')  // false
 * await isEmojiVersionValid('1.1.0')  // false
 * ```
 */
export async function isEmojiVersionValid(version: string): Promise<boolean> {
  // unicode consortium made a huge change in v11, because that is actually the version
  // right after v5. They decided to align the unicode version with the emoji version in 2017.
  // So, no emoji version 6, 7, 8, 9, or 10.
  const isVersionInNoEmojiVersions = NON_EXISTING_VERSIONS.find((v) => semver.satisfies(version, v));
  if (isVersionInNoEmojiVersions) {
    return false;
  }

  // from v1 to v5, there was only major releases. So no v1.1, v1.2, etc.
  // only, v1.0, v2.0, v3.0, v4.0, v5.0.
  // if version has any minor or patch, it is invalid.
  if (semver.major(version) <= 5 && (semver.minor(version) !== 0 || semver.patch(version) !== 0)) {
    return false;
  }

  return true;
}

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
 * Gets the latest non-draft emoji version from an array of emoji versions.
 *
 * @param {EmojiVersion[]} versions - An array of emoji versions to search through
 * @returns {EmojiVersion | null} The latest non-draft emoji version, or null if no valid versions found
 *
 * @example
 * ```ts
 * const versions = [
 *   { emoji_version: "15.1", draft: false },
 *   { emoji_version: "15.0", draft: false },
 *   { emoji_version: "15.2", draft: true }
 * ];
 * const latest = getLatestEmojiVersion(versions);
 * // Returns: { emoji_version: "15.1", draft: false }
 * ```
 */
export function getLatestEmojiVersion(versions: EmojiVersion[]): EmojiVersion | null {
  // filter draft versions & invalid out and sort by using semver.
  const filtered = versions
    .filter((v) => !v.draft)
    .map((v) => ({
      original: v,
      semver: toSemverCompatible(v.emoji_version),
    }))
    .filter((v): v is { original: EmojiVersion; semver: string } => v.semver !== null)
    .sort((a, b) => semver.compare(b.semver, a.semver));

  if (!filtered.length || filtered[0] == null) {
    return null;
  }

  return filtered[0].original;
}
