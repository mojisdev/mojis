import { defineAdapterHandler } from "../define";

// These emoji versions doesn't seem to have a emoji-test,
// where we can extract the metadata from.
const DISALLOWED_EMOJI_VERSIONS = ["1.0", "2.0", "3.0"];

export const modern_metadata_handler = defineAdapterHandler({
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
  parser: "splitter",
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
      foo: "bar",
    };
  },
  aggregate(ctx, data) {
    return data[0];
  },
  output(_ctx, transformed) {
    console.warn("transformed.aggregatedFoo", transformed.foo);
    return {
      groups: [],
      emojis: [],
    };
  },
});

export const modern_sequence_handler = defineAdapterHandler({
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
  parser: "splitter",
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
