import { type EmojiSequence, expandHexRange, FEMALE_SIGN, MALE_SIGN } from "@mojis/internal-utils";
import { defineMojiAdapter } from "../../define";

export const modernAdapter = defineMojiAdapter({
  name: "modern",
  description: "adapter for the modern emoji versions",
  range: ">=11.0.0",
  extend: "base",
  sequences: {
    urls(ctx) {
      return [
        {
          key: "sequences",
          url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-sequences.txt`,
          cacheKey: `v${ctx.emoji_version}/sequences.json`,
        },
        {
          key: "zwj",
          url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-zwj-sequences.txt`,
          cacheKey: `v${ctx.emoji_version}/zwj-sequences.json`,
        },
      ];
    },
    transform(_, data) {
      if (data == null) {
        return {
          sequences: [],
          zwj: [],
        };
      }

      const sequences: EmojiSequence[] = [];
      const zwj: EmojiSequence[] = [];

      for (const __data of data) {
        if (__data == null) {
          throw new Error("invalid data");
        }

        const { key, data: _data } = __data;

        const lines = _data.split("\n");

        const isZwj = key === "zwj";
        const internal = isZwj ? zwj : sequences;

        for (let line of lines) {
          // skip empty line & comments
          if (line.trim() === "" || line.startsWith("#")) {
            continue;
          }

          // remove line comment
          const commentIndex = line.indexOf("#");
          if (commentIndex !== -1) {
            line = line.slice(0, commentIndex).trim();
          }

          const [hex, property, description] = line.split(";").map((col) => col.trim()).slice(0, 4);

          if (hex == null || property == null || description == null) {
            throw new Error(`invalid line: ${line}`);
          }

          const expandedHex = expandHexRange(hex);

          for (const hex of expandedHex) {
            internal.push({
              hex: hex.replace(/\s+/g, "-"),
              property,
              description,
              gender: hex.includes(FEMALE_SIGN) ? "female" : hex.includes(MALE_SIGN) ? "male" : null,
            });
          }
        }
      }

      return {
        sequences,
        zwj,
      };
    },
  },
});
