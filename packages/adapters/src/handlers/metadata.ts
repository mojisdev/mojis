import type { EmojiGroup, EmojiMetadata } from "@mojis/internal-utils";
import { extractEmojiVersion, extractUnicodeVersion, isBefore } from "@mojis/internal-utils";
import { createAdapterHandlerBuilder } from "../builder";

function slugify(val: string): string {
  return val.normalize("NFD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\(.+\)/g, "")
    .replace("&", "")
    .replace(/[\W_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// These emoji versions doesn't seem to have a emoji-test,
// which we need to extract the groups and such from.
// We will probably just have to "generate" them from a html page.
const DISALLOWED_EMOJI_VERSIONS = ["1.0", "2.0", "3.0"];

const builder = createAdapterHandlerBuilder({
  type: "metadata",
});

export const handler = builder
  .onVersion(
    (emoji_version) => !DISALLOWED_EMOJI_VERSIONS.includes(emoji_version),
    (builder) => builder.urls((ctx) => {
      return {
        url: `https://unicode-proxy.mojis.dev/proxy/emoji/${ctx.emoji_version}/emoji-test.txt`,
        cacheKey: `v${ctx.emoji_version}/metadata`,
      };
    })
      .parser((_, data) => {
        return data.split("\n");
      })
      .transform((ctx, lines) => {
        return {
          groups: [],
          emojis: {},
        };
      })
      .output((ctx, transformed) => {
        return transformed;
      }),
  )
  .onVersion((emoji_version) => DISALLOWED_EMOJI_VERSIONS.includes(emoji_version), (builder) => builder.urls(() => undefined)
    .parser("generic")
    .transform(() => undefined)
    .output(() => ({
      groups: [],
      emojis: {},
    })));
