import type { EmojiGroup, EmojiMetadata } from "@mojis/internal-utils";
import { extractEmojiVersion, extractUnicodeVersion, isBefore } from "@mojis/internal-utils";
import { defineAdapterHandler } from "../define";

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

export const baseMetadataHandler = defineAdapterHandler({
  type: "metadata",
  shouldExecute: (ctx) => {
    // Since we can't get the metadata for these versions,
    // we will just skip them.
    // We have a fallback handler for these versions (notSupportedMetadataHandler) find it below.
    return !DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version);
  },
  urls: (ctx) => {
    return {
      url: `https://unicode-proxy.mojis.dev/proxy/emoji/${ctx.emoji_version}/emoji-test.txt`,
      cacheKey: `v${ctx.emoji_version}/metadata`,
    };
  },
  parser: (_, data) => {
    return data.split("\n");
  },
  transform(ctx, lines) {
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

      // if the emoji_version is v5 and under.
      // the content after the # doesn't include the emoji version.
      let emoji;
      let trimmedComment;

      const extractedEmojiVersion = extractEmojiVersion(comment.trim());

      if (isBefore(ctx.emoji_version, "6.0.0")) {
        [emoji, trimmedComment] = comment.trim().split(" ");
      } else {
        [emoji, trimmedComment] = comment.trim().split(` E${extractedEmojiVersion} `);
      }

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
        emojiVersion: extractedEmojiVersion || null,
        unicodeVersion: extractUnicodeVersion(extractedEmojiVersion, ctx.unicode_version),
        description: trimmedComment || "",
        emoji: emoji || null,
        hexcodes: hexcode.split("-"),
      };
    }

    return {
      groups,
      emojis,
    };
  },
  output(_ctx, transformed) {
    return transformed;
  },
});

// Handles the versions that doesn't seem to have an emoji-test file.
// We will just return an empty object for these versions.
export const notSupportedMetadataHandler = defineAdapterHandler({
  type: "metadata",
  shouldExecute: (ctx) => {
    return DISALLOWED_EMOJI_VERSIONS.includes(ctx.emoji_version);
  },
  urls: () => {
    return undefined;
  },
  parser: "generic",
  transform() {
    return undefined;
  },
  output() {
    return {
      groups: [],
      emojis: {},
    };
  },
});
