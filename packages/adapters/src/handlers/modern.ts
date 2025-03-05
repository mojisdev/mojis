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
  transform(_ctx, _data) {
    return {
      test: {
        foo: "bar",
      },
    };
  },
  aggregate(_ctx, data) {
    console.warn("data.test", data[0].test);
    return {
      aggregatedTest: data.map((d) => d.test),
    };
  },
  output(_ctx, transformed) {
    console.warn("transformed.aggregatedTest", transformed.aggregatedTest);
    return transformed;
  },
});
