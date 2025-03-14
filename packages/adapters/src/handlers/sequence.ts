import type { EmojiSequence } from "@mojis/internal-utils";
import { expandHexRange, FEMALE_SIGN, MALE_SIGN } from "@mojis/internal-utils";
import semver from "semver";
import { defineAdapterHandler } from "../define";

export const NOT_EXISTING = ["1.0"];

// There doesn't seem to exists a emoji-sequences.txt or emoji-zwj-sequences.txt file for versions
// before v2.
export const baseSequenceHandler = defineAdapterHandler({
  type: "sequence",
  shouldExecute: ({ emoji_version }) => !NOT_EXISTING.includes(emoji_version),
  urls: ({ emoji_version }) => {
    return [
      {
        key: "sequences",
        url: `https://unicode.org/Public/emoji/${emoji_version}/emoji-sequences.txt`,
        cacheKey: `v${emoji_version}/sequences`,
      },
      {
        key: "zwj",
        url: `https://unicode.org/Public/emoji/${emoji_version}/emoji-zwj-sequences.txt`,
        cacheKey: `v${emoji_version}/zwj-sequences`,
      },
    ];
  },
  parser: "generic",
  parserOptions: {
    defaultProperty: "Emoji",
    propertyMap: {
      "# Combining sequences": "Emoji_Combining_Sequence",
      "# Emoji Combining Sequence": "Emoji_Combining_Sequence",
      "# Emoji Flag Sequence": "Emoji_Flag_Sequence",
      "# Emoji Keycap Sequence": "Emoji_Keycap_Sequence",
      "# Emoji Modifier Sequence": "Emoji_Modifier_Sequence",
      "# Emoji Tag Sequence": "Emoji_Tag_Sequence",
      "# Emoji ZWJ Sequence": "Emoji_ZWJ_Sequence",
      "# Flag sequences": "Emoji_Flag_Sequence",
      "# Modifier sequences": "Emoji_Modifier_Sequence",
      "# ZWJ sequences": "Emoji_ZWJ_Sequence",
      // 12.0+
      "# Basic_Emoji": "Basic_Emoji",
      "# Emoji_Keycap_Sequence": "Emoji_Keycap_Sequence",
      "# Emoji_Flag_Sequence": "Emoji_Flag_Sequence",
      "# Emoji_Tag_Sequence": "Emoji_Tag_Sequence",
      "# Emoji_Modifier_Sequence": "Emoji_Modifier_Sequence",
      "# Emoji_ZWJ_Sequence": "Emoji_ZWJ_Sequence",
      // 13.0+
      "# RGI_Emoji_Flag_Sequence": "RGI_Emoji_Flag_Sequence",
      "# RGI_Emoji_Modifier_Sequence": "RGI_Emoji_Modifier_Sequence",
      "# RGI_Emoji_Tag_Sequence": "RGI_Emoji_Tag_Sequence",
      "# RGI_Emoji_ZWJ_Sequence": "RGI_Emoji_ZWJ_Sequence",
    },
  },
  transform(_, data) {
    const sequences: EmojiSequence[] = [];

    for (const line of data.lines) {
      const [hex, property, description] = line.fields;

      if (hex == null || property == null || description == null) {
        throw new Error(`invalid line: ${line}`);
      }

      const expandedHex = expandHexRange(hex);

      for (const hex of expandedHex) {
        sequences.push({
          hex: hex.replace(/\s+/g, "-"),
          property,
          description,
          gender: hex.includes(FEMALE_SIGN) ? "female" : hex.includes(MALE_SIGN) ? "male" : null,
        });
      }
    }

    return sequences;
  },
  aggregate(_, data) {
    return {
      sequences: data[0],
      zwj: data[1],
    };
  },
  output(_, transformed) {
    return transformed;
  },
});

// Handles the versions that doesn't seem to have an emoji-sequences.txt or emoji-zwj-sequences.txt file.
// We will just return an empty object for these versions.
export const notSupportedSequenceHandler = defineAdapterHandler({
  type: "sequence",
  shouldExecute: (ctx) => NOT_EXISTING.includes(ctx.emoji_version),
  urls: () => {
    return undefined;
  },
  parser: "generic",
  transform() {
    return undefined;
  },
  output() {
    return {
      zwj: [],
      sequences: [],
    };
  },
});
