import type { EmojiGroup, EmojiMetadata } from "@mojis/internal-utils";
import { defineAdapterHandler } from "../../define";

// These emoji versions doesn't seem to have a emoji-test,
// where we can extract the metadata from.
const DISALLOWED_EMOJI_VERSIONS = ["1.0", "2.0", "3.0"];

export const modernMetadataHandler = defineAdapterHandler({
  type: "metadata",
  shouldExecute: (ctx) => {
    return !DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version);
  },
  urls: (ctx) => {
    if (DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version)) {
      return undefined;
    }

    return {
      url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-test.txt`,
      cacheKey: `v${ctx.emoji_version}/metadata`,
    };
  },
  parser: "generic",
  parserOptions: {
    separator: ";",
  },
  transform(ctx, data) {
    console.warn("key", ctx.key);

    console.log(data);

    for (const line of data.lines) {
      console.log(line);
    }

    return {
      groups: [] as EmojiGroup[],
      emojis: {} as Record<string, Record<string, EmojiMetadata>>,
    };
  },
  output(_ctx, transformed) {
    return transformed;
  },
});
