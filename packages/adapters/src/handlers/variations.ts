import type { EmojiVariation } from "@mojis/schemas/emojis";
import { EMOJI_VARIATION_SCHEMA } from "@mojis/schemas/emojis";
import semver from "semver";
import { z } from "zod";
import { createAdapterHandlerBuilder } from "../adapter-builder";

const UNSUPPORTED_VARIATION_VERSIONS = ["1.0", "2.0", "3.0", "4.0"];

const builder = createAdapterHandlerBuilder({
  type: "variations",
});

export const handler = builder
  .onVersion(
    (version) => !UNSUPPORTED_VARIATION_VERSIONS.includes(version),
    (builder) => builder
      .validation(z.array(EMOJI_VARIATION_SCHEMA))
      .urls((ctx) => {
        if (semver.lte(`${ctx.unicode_version}.0`, "12.1.0")) {
          return {
            url: `https://unicode-proxy.mojis.dev/proxy/emoji/${ctx.emoji_version}/emoji-variation-sequences.txt`,
            cacheKey: `v${ctx.emoji_version}/variations`,
          };
        }

        return {
          url: `https://unicode-proxy.mojis.dev/proxy/${ctx.unicode_version}.0/ucd/emoji/emoji-variation-sequences.txt`,
          cacheKey: `v${ctx.emoji_version}/variations`,
        };
      })
      .parser("generic")
      .transform((_, data) => {
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
      })
      .output((_, transformed) => {
        //          ^?
        return transformed;
      }),
  ).onVersion(
    (version) => UNSUPPORTED_VARIATION_VERSIONS.includes(version),
    (builder) => builder.urls(() => undefined)
      .parser("generic")
      .transform(() => undefined)
      .output(() => []),
  ).build();
