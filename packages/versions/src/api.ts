import type { EmojiSpecRecord } from "@mojis/schemas/emojis";
import mojiCompare from "@mojis/moji-compare";
import { toSemverCompatible } from "./conversion";
import { extractVersionFromReadme } from "./extraction";
import { isEmojiVersionAllowed } from "./validation";

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
  const [draftText, emojiText] = await Promise.all([
    "https://unicode-proxy.ucdjs.dev/draft/ReadMe.txt",
    "https://unicode-proxy.ucdjs.dev/draft/emoji/ReadMe.txt",
  ].map(async (url) => {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`failed to fetch ${url}: ${res.status}`);
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
  if (mojiCompare.major(rootVersion) !== mojiCompare.major(`${emojiVersion}.0`) || mojiCompare.minor(rootVersion) !== mojiCompare.minor(`${emojiVersion}.0`)) {
    throw new Error("draft versions do not match");
  }

  return {
    emoji_version: emojiVersion,
    unicode_version: rootVersion,
  };
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
 * @returns {Promise<EmojiSpecRecord[]>} A promise that resolves to an array of emoji versions,
 *                             sorted according to semver rules
 */
export async function getAllEmojiVersions(): Promise<EmojiSpecRecord[]> {
  const [rootResult, emojiResult] = await Promise.allSettled([
    "https://unicode-proxy.ucdjs.dev/",
    "https://unicode-proxy.ucdjs.dev/emoji/",
  ].map(async (url) => {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`[versions]: failed to fetch ${url}: ${res.statusText}`);
    }

    return res.json() as Promise<{
      type: "directory" | "file";
      name: string;
      path: string;
    }[]>;
  }));

  if (rootResult == null || emojiResult == null) {
    throw new Error("failed to fetch root or emoji page");
  }

  if (rootResult.status === "rejected" || emojiResult.status === "rejected") {
    console.error("[versions]", {
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch root or emoji page");
  }

  const rootJson = rootResult.value;
  const emojiJson = emojiResult.value;

  if (!rootJson || !emojiJson) {
    throw new Error("failed to fetch root or emoji page");
  }
  const versionRegex = /\d+\.\d+(?:\.\d+)?$/;

  const draft = await getCurrentDraftVersion();

  if (draft == null) {
    throw new Error("failed to extract draft version");
  }

  const versions: EmojiSpecRecord[] = [];

  for (const entry of rootJson.filter((v) => v.type === "directory" && versionRegex.test(v.name))) {
    const version = entry.name;

    if (!isEmojiVersionAllowed(version)) {
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

  for (const entry of emojiJson.filter((v) => v.type === "directory" && versionRegex.test(v.name))) {
    let version = entry.name;

    // for the emoji page, the versions is not valid semver.
    // so we will add the last 0 to the version.
    // handle both 5.0 and 12.0 -> 5.0.0 and 12.0.0
    if (version.length === 3 || version.length === 4) {
      version += ".0";
    }

    if (!isEmojiVersionAllowed(version)) {
      continue;
    }

    // check if the unicode_version already exists.
    // if it does, we will update the emoji version.
    const existing = versions.find((v) => v.unicode_version === version);
    let unicode_version = null;

    // the emoji version 13.1 is using the unicode
    // 13.0, since it was never released.
    if (entry.name === "13.1") {
      unicode_version = "13.0.0";
    }

    if (entry.name === "5.0") {
      unicode_version = "10.0.0";
    }

    if (entry.name === "4.0" || entry.name === "3.0") {
      unicode_version = "9.0.0";
    }

    if (entry.name === "2.0" || entry.name === "1.0") {
      unicode_version = "8.0.0";
    }

    if (existing) {
      existing.unicode_version = unicode_version || existing.unicode_version;
      existing.emoji_version = entry.name;
      continue;
    }

    versions.push({
      emoji_version: entry.name,
      unicode_version: unicode_version || entry.name,
      draft: version === draft.unicode_version || version === draft.emoji_version,
    });
  }

  return versions.sort((a, b) => mojiCompare.compareSortable(`${b.emoji_version}.0`, `${a.emoji_version}.0`));
}

/**
 * Gets the latest non-draft emoji version from an array of emoji versions.
 *
 * @param {EmojiSpecRecord[]} versions - An array of emoji versions to search through
 * @param {boolean} includeDrafts - Whether to include draft versions in the search
 * @returns {EmojiSpecRecord | null} The latest non-draft emoji version, or null if no valid versions found
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
export function getLatestEmojiVersion(versions: EmojiSpecRecord[], includeDrafts: boolean = false): EmojiSpecRecord | null {
  // filter draft versions & invalid out and sort by using semver.
  const filtered = versions
    .filter((v) => includeDrafts || !v.draft)
    .map((v) => ({
      original: v,
      semver: toSemverCompatible(v.emoji_version),
    }))
    .filter((v): v is { original: EmojiSpecRecord; semver: string } => v.semver !== null)
    .sort((a, b) => mojiCompare.compareSortable(b.semver, a.semver));

  if (!filtered.length || filtered[0] == null) {
    return null;
  }

  return filtered[0].original;
}
