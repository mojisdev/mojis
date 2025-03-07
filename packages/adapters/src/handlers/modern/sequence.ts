import { defineAdapterHandler } from "../../define";

export const modernSequenceHandler = defineAdapterHandler({
  type: "sequence",
  urls: (ctx) => {
    return [
      {
        key: "sequences",
        url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-sequences.txt`,
        cacheKey: `v${ctx.emoji_version}/sequences`,
      },
      {
        key: "zwj",
        url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-zwj-sequences.txt`,
        cacheKey: `v${ctx.emoji_version}/zwj-sequences`,
      },
    ];
  },
  parser: "generic",
  shouldExecute: (ctx) => {
    return ctx.emoji_version === "16.0";
  },
  transform(ctx, data) {
    console.warn("key", ctx.key);
    return data;
  },
  aggregate(ctx, data) {
    console.log("aggregate", data);
    return data.flat();
  },
  output(_ctx, transformed) {
    return transformed;
  },
});
