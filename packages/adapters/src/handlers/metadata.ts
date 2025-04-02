import type { EmojiGroup, GroupedEmojiMetadata } from "@mojis/schemas/emojis";
import { extractEmojiVersion, extractUnicodeVersion, isBefore } from "@mojis/internal-utils";
import { EMOJI_GROUPS_SCHEMA, GROUPED_EMOJI_METADATA_SCHEMA } from "@mojis/schemas/emojis";
import { z } from "zod";
import { createAdapterHandlerBuilder } from "../adapter-builder/builder";

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
  outputSchema: z.object({
    groups: EMOJI_GROUPS_SCHEMA,
    emojis: GROUPED_EMOJI_METADATA_SCHEMA,
  }),
});

export const handler = builder
  .onVersion(
    (emoji_version) => !DISALLOWED_EMOJI_VERSIONS.includes(emoji_version),
    (builder) => {
      return builder
        .urls((ctx) => {
          return {
            url: `https://unicode-proxy.mojis.dev/proxy/emoji/${ctx.emoji_version}/emoji-test.txt`,
            cacheKey: `v${ctx.emoji_version}/metadata`,
          };
        })
        .parser((_, data) => {
          //          ^?
          return data.split("\n");
        })
        .transform((ctx, lines) => {
        //                ^?

          let currentGroup: EmojiGroup | undefined;

          const groups: EmojiGroup[] = [];

          // [group-subgroup][hexcode] = metadata
          const emojis: GroupedEmojiMetadata = {};

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
        })
        .output((ctx, transformed) => {
        //            ^?
          return transformed;
        });
    },
  )
  .fallback(() => {
    return {
      emojis: {},
      groups: [],
    };
  })
  // .onError((err) => {
  //   console.error(err);
  // })
  .build();
