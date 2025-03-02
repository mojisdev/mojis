import {
  type EmojiGroup,
  type EmojiMetadata,
  extractEmojiVersion,
  extractUnicodeVersion,
} from "@mojis/internal-utils";
import { defineMojiAdapter } from "../../define";

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
// where we can extract the metadata from.
const DISALLOWED_EMOJI_VERSIONS = ["1.0", "2.0", "3.0"];

export const baseAdapter = defineMojiAdapter({
  name: "base",
  description: "base adapter",
  range: "*",
  metadata: {
    urls(ctx) {
      if (DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version)) {
        return undefined;
      }

      return {
        url: `https://unicode.org/Public/emoji/${ctx.emoji_version}/emoji-test.txt`,
        cacheKey: `v${ctx.emoji_version}/metadata`,
      };
    },

    transform(ctx, data) {
      if (data == null) {
        return {
          emojis: {},
          groups: [],
        };
      }

      const lines = data.split("\n");
      let currentGroup: EmojiGroup | undefined;

      const groups: EmojiGroup[] = [];

      // [group-subgroup][hexcode] = metadata
      const emojis: Record<string, Record<string, EmojiMetadata>> = {};

      for (const line of lines) {
        if (line.trim() === "") {
          continue;
        }

        if (line.startsWith("# group:")) {
          const groupName = line.slice(8).trim();

          const group: EmojiGroup = {
            name: groupName,
            slug: slugify(groupName),
            subgroups: [],
          };

          currentGroup = group;

          groups.push(group);

          continue;
        } else if (line.startsWith("# subgroup:")) {
          const subgroupName = line.slice(11).trim();

          if (currentGroup == null) {
            throw new Error(`subgroup ${subgroupName} without group`);
          }

          currentGroup.subgroups.push(slugify(subgroupName));

          continue;
        } else if (line.startsWith("#")) {
          continue;
        }

        const [baseHexcode, trailingLine] = line.split(";");

        if (baseHexcode == null || trailingLine == null) {
          throw new Error(`invalid line: ${line}`);
        }

        const [baseQualifier, comment] = trailingLine.split("#");

        if (baseQualifier == null || comment == null) {
          throw new Error(`invalid line: ${line}`);
        }

        const hexcode = baseHexcode.trim().replace(/\s+/g, "-");
        const qualifier = baseQualifier.trim();

        const emojiVersion = extractEmojiVersion(comment.trim());
        const [emoji, trimmedComment] = comment.trim().split(` E${emojiVersion} `);

        const groupName = currentGroup?.slug ?? "unknown";
        const subgroupName = currentGroup?.subgroups[currentGroup.subgroups.length - 1] ?? "unknown";

        const metadataGroup = `${groupName}-${subgroupName}`;

        if (emojis[metadataGroup] == null) {
          emojis[metadataGroup] = {};
        }

        emojis[metadataGroup][hexcode] = {
          group: groupName,
          subgroup: subgroupName,
          qualifier,
          emojiVersion: emojiVersion || null,
          unicodeVersion: extractUnicodeVersion(emojiVersion, ctx.unicode_version),
          description: trimmedComment || "",
          emoji: emoji || null,
          hexcodes: hexcode.split("-"),
        };
      }

      return {
        emojis,
        groups,
      };
    },
  },
});
