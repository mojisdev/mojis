import {
  type EmojiSequence,
  expandHexRange,
  fetchCache,
} from "@mojis/internal-utils";
import {
  FEMALE_SIGN,
  MALE_SIGN,
} from "@mojis/internal-utils/constants";
import { defineMojiAdapter } from "../../define";
// import { adapterSequenceGroup } from "./sequences";

export const modernAdapter = defineMojiAdapter({
  name: "modern",
  description: "adapter for the modern emoji versions",
  range: ">=11.0.0",
  extend: "base",
  // sequences: {
  //   url: (ctx) => [
  //     `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-sequences.txt`,
  //     `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-zwj-sequences`,
  //   ],
  //   cacheKey: (ctx) => `v${ctx.emoji_version}/sequences.json`,
  //   transform: adapterSequenceGroup,
  // },
  // async sequences(ctx) {
  //   const [sequences, zwj] = await Promise.all([
  //     {
  //       cacheKey: `v${ctx.versions.emoji_version}/sequences.json`,
  //       url: `https://unicode.org/Public/emoji/${ctx.versions.emoji_version}/emoji-sequences.txt`,
  //     },
  //     {
  //       cacheKey: `v${ctx.versions.emoji_version}/zwj-sequences.json`,
  //       url: `https://unicode.org/Public/emoji/${ctx.versions.emoji_version}/emoji-zwj-sequences.txt`,
  //     },
  //   ].map(async ({ cacheKey, url }) => {
  //     return await fetchCache(url, {
  //       cacheKey,
  //       parser(data) {
  //         const lines = data.split("\n");

  //         const sequences: EmojiSequence[] = [];

  //         for (let line of lines) {
  //           // skip empty line & comments
  //           if (line.trim() === "" || line.startsWith("#")) {
  //             continue;
  //           }

  //           // remove line comment
  //           const commentIndex = line.indexOf("#");
  //           if (commentIndex !== -1) {
  //             line = line.slice(0, commentIndex).trim();
  //           }

  //           const [hex, property, description] = line.split(";").map((col) => col.trim()).slice(0, 4);

  //           if (hex == null || property == null || description == null) {
  //             throw new Error(`invalid line: ${line}`);
  //           }

  //           const expandedHex = expandHexRange(hex);

  //           for (const hex of expandedHex) {
  //             sequences.push({
  //               hex: hex.replace(/\s+/g, "-"),
  //               property,
  //               description,
  //               gender: hex.includes(FEMALE_SIGN) ? "female" : hex.includes(MALE_SIGN) ? "male" : null,
  //             });
  //           }
  //         }

  //         return sequences;
  //       },
  //       bypassCache: ctx.force,
  //     });
  //   }));

  //   return {
  //     sequences: sequences || [],
  //     zwj: zwj || [],
  //   };
  // },
});
