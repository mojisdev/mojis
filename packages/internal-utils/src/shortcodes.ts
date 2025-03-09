import { fetchCache } from "./cache";

export interface EmojiShortcode {
  /**
   * The shortcode for the emoji.
   */
  code: string;

  /**
   * Vendor-specific shortcode.
   *
   * e.g. GitHub, Slack, Discord etc.
   */
  vendor: string;

  /**
   * Source of the shortcode.
   *
   * e.g. GitHub, Slack, Discord etc.
   */
  source?: string;
}

export interface ShortcodeOptions {
  /**
   * Force bypassing the cache.
   */
  force: boolean;

  /**
   * Emojis database.
   */
  emojis: Map<string, string>;
}

/**
 * Generates GitHub emoji shortcodes by fetching from GitHub's emoji API.
 *
 * @param {ShortcodeOptions} options - Configuration options for shortcode generation
 *
 * @returns {EmojiShortcode[]} Promise that resolves to an array of emoji shortcodes with GitHub-specific data
 *
 * @example
 * ```ts
 * const shortcodes = await generateGitHubShortcodes({
 *   emojis: emojiMap,
 *   force: false
 * });
 * ```
 */
export async function generateGitHubShortcodes(options: ShortcodeOptions): Promise<EmojiShortcode[]> {
  const { emojis, force } = options;

  let githubEmojis: Record<string, string> = {};

  try {
    githubEmojis = await fetchCache<Record<string, string>>("https://api.mojis.dev/api/gateway/github/emojis", {
      cacheKey: `github-emojis.json`,
      bypassCache: force,
      parser: (data) => JSON.parse(data) as Record<string, string>,
    });
  } catch (err) {
    console.error("[shortcodes]: failed to fetch github emojis", err);
  }

  const shortcodes: EmojiShortcode[] = [];

  for (const [shortcode, url] of Object.entries(githubEmojis)) {
    const match = url.match(/emoji\/unicode\/([\da-z-]+)\.png/i);

    // github has some standard emojis that don't have
    // a unicode representation which we should skip
    if (match == null || match[1] == null) {
      continue;
    }

    const hexcode = match[1].toUpperCase();

    if (emojis.get(hexcode) == null) {
      continue;
    }

    shortcodes.push({
      code: shortcode,
      vendor: "github",
      source: "github",
    });
  }

  return shortcodes;
}
