import { defineAdapterHandler, type v2_AdapterHandler } from "../types";

// These emoji versions doesn't seem to have a emoji-test,
// where we can extract the metadata from.
const DISALLOWED_EMOJI_VERSIONS = ["1.0", "2.0", "3.0"];

export const modern_metadata_handler = defineAdapterHandler({
  type: "metadata",
  urls: (ctx) => {
    if (DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version)) {
      return undefined;
    }

    return {
      url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-test.txt`,
      cacheKey: `v${ctx.emoji_version}/metadata`,
    };
  },
  // parser(ctx, data) {
  //   return "hello";
  // },
  parser: "splitter",
  // TODO: make thos fail if no a builtin parser
  parserOptions: {
    separator: ";",
  },
  transform(_ctx, _data) {
    return {
      foo: "bar",
    };
  },
  aggregate(_ctx, data) {
    console.warn("data.foo", data[0].foo);
    return {
      aggregatedFoo: data.map((d) => d.foo),
    };
  },
  output(_ctx, transformed) {
    console.warn("transformed.aggregatedFoo", transformed.aggregatedFoo);
    return transformed;
  },
});
