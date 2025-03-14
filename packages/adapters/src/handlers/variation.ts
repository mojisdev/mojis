import type { EmojiVariation } from "@mojis/internal-utils";
import semver from "semver";
import { defineAdapterHandler } from "../define";

export const UNSUPPORTED_VARIATION_VERSIONS = ["1.0", "2.0", "3.0", "4.0"];

// There doesn't seem to exists a emoji-variation-sequences.txt file for versions
// before v5.0
export const baseVariationHandler = defineAdapterHandler({
  type: "variation",
  shouldExecute: ({ emoji_version }) => !UNSUPPORTED_VARIATION_VERSIONS.includes(emoji_version),
  urls: (ctx) => {
    if (semver.lte(`${ctx.unicode_version}.0`, "12.1.0")) {
      return {
        url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-variation-sequences.txt`,
        cacheKey: `v${ctx.emoji_version}/variations`,
      };
    }

    return {
      url: `https://unicode.org/Public/${ctx.unicode_version}.0/ucd/emoji/emoji-variation-sequences.txt`,
      cacheKey: `v${ctx.emoji_version}/variations`,
    };
  },
  parser: "generic",
  transform(_, data) {
    const variations: EmojiVariation[] = [];

    for (const line of data.lines) {
      const [hex, style] = line.fields;

      if (hex == null || style == null) {
        throw new Error(`invalid line: ${line}`);
      }

      const hexcode = hex.replace(/\s+/g, "-");
      const type = style.replace("style", "").trim();

      if (type !== "text" && type !== "emoji") {
        throw new Error(`invalid style: ${style}`);
      }

      variations.push({
        emoji: type === "emoji" ? hexcode : null,
        text: type === "text" ? hexcode : null,
        property: ["Emoji"],
      });
    }

    return variations;
  },
  output(_, transformed) {
    return transformed;
  },
});

// Handles the versions that doesn't seem to have an emoji-test file.
// We will just return an empty object for these versions.
export const notSupportedVariationHandler = defineAdapterHandler({
  type: "variation",
  shouldExecute: (ctx) => UNSUPPORTED_VARIATION_VERSIONS.includes(ctx.emoji_version),
  urls: () => {
    return undefined;
  },
  parser: "generic",
  transform() {
    return undefined;
  },
  output() {
    return [];
  },
});
