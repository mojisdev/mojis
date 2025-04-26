import type { EmojiVariation } from "@mojis/schemas/emojis";
import { lte } from "@mojis/moji-compare";
import { EMOJI_VARIATION_SCHEMA } from "@mojis/schemas/emojis";
import { createSourceAdapter } from "../../builders/source-builder/builder";
import { joinPath } from "../../utils";

const UNSUPPORTED_VARIATION_VERSIONS = ["1.0", "2.0", "3.0", "4.0"];

const builder = createSourceAdapter({
  type: "variations",
  transformerOutputSchema: EMOJI_VARIATION_SCHEMA.array(),
  fallback: [],
  persistence: {
    schemas: {
      variations: {
        pattern: "**/variations.json",
        get filePath() {
          return joinPath("<base-path>", "variations.json");
        },
        type: "json",
        schema: EMOJI_VARIATION_SCHEMA.array(),
      },
    },
  },
});

export const handler = builder
  .withTransform(
    (version) => !UNSUPPORTED_VARIATION_VERSIONS.includes(version),
    (builder) => builder
      .urls((ctx) => {
        if (lte(ctx.unicode_version, "12.1")) {
          return {
            url: `https://unicode-proxy.ucdjs.dev/proxy/emoji/${ctx.emoji_version}/emoji-variation-sequences.txt`,
            cacheKey: `v${ctx.emoji_version}/variations`,
          };
        }

        return {
          url: `https://unicode-proxy.ucdjs.dev/proxy/${ctx.unicode_version}.0/ucd/emoji/emoji-variation-sequences.txt`,
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
  )
  .toPersistenceOperations((references, data) => {
    return [
      {
        reference: references.variations,
        data,
      },
    ];
  })
  .build();
