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
  emojis: any;
}

export async function generateGitHubShortcodes(options: ShortcodeOptions): Promise<EmojiShortcode[]> {
  const { emojis, force } = options;

  const githubEmojis = await fetchCache<Record<string, string>>("https://api.github.com/emojis", {
    cacheKey: `github-emojis.json`,
    bypassCache: force,
    parser(data) {
      return JSON.parse(data);
    },
    options: {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "mojis.dev",
      },
    },
  });

  const shortcodes: EmojiShortcode[] = [];

  for (const [shortcode, url] of Object.entries(githubEmojis)) {
    const match = url.match(/emoji\/unicode\/([\da-z-]+)\.png/i);

    // github has some standard emojis that don't have a unicode representation
    if (!match || !match[1]) {
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
