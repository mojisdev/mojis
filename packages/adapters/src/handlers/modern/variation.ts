import semver from "semver";
import { defineAdapterHandler } from "../../define";

export const modernVariationHandler = defineAdapterHandler({
  type: "variation",
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
  shouldExecute: (ctx) => {
    return semver.gte(`${ctx.unicode_version}.0`, "11.0.0");
  },
  transform(ctx, data) {
    console.warn("key", ctx.key);
    return data;
  },
  aggregate(ctx, data) {
    return data.flat();
  },
  output(_ctx, transformed) {
    return transformed;
  },
});
