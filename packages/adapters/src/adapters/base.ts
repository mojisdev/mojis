import { type EmojiGroup, type EmojiMetadata, extractEmojiVersion, extractUnicodeVersion, fetchCache, MojisNotImplemented } from "@mojis/internal-utils";
import { defineMojiAdapter } from "../adapter";

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

function notImplemented(adapterFn: string) {
  return async () => {
    throw new MojisNotImplemented(`the adapter function ${adapterFn} is not implemented`);
  };
}

export default defineMojiAdapter({
  name: "base",
  description: "base adapter",
  range: "*",
  metadata: async ({
    unicodeVersion,
    emojiVersion,
    force,
  }) => {
    if (emojiVersion === "1.0" || emojiVersion === "2.0" || emojiVersion === "3.0") {
      console.warn(`skipping metadata for emoji version ${emojiVersion}, as it's not supported.`);
      return {
        groups: [],
        emojiMetadata: {},
      };
    }

    return fetchCache(`https://unicode.org/Public/emoji/${emojiVersion}/emoji-test.txt`, {
      cacheKey: `v${emojiVersion}/metadata.json`,
      parser(data) {
        const lines = data.split("\n");
        let currentGroup: EmojiGroup | undefined;

        const groups: EmojiGroup[] = [];

        // [group-subgroup][hexcode] = metadata
        const emojiMetadata: Record<string, Record<string, EmojiMetadata>> = {};

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

          if (emojiMetadata[metadataGroup] == null) {
            emojiMetadata[metadataGroup] = {};
          }

          emojiMetadata[metadataGroup][hexcode] = {
            group: groupName,
            subgroup: subgroupName,
            qualifier,
            emojiVersion: emojiVersion || null,
            unicodeVersion: extractUnicodeVersion(emojiVersion, unicodeVersion),
            description: trimmedComment || "",
            emoji: emoji || null,
            hexcodes: hexcode.split("-"),
          };
        }

        return {
          groups,
          emojiMetadata,
        };
      },
      bypassCache: force,
    });
  },
  // sequences: notImplemented("sequences"),
  // emojis: notImplemented("emojis"),
  // variations: notImplemented("variations"),
  // unicodeNames: async ({ }) => {
  //   return fetchCache(`https://unicode.org/Public/${ctx.emojiVersion === "13.1" ? "13.0" : ctx.emojiVersion}.0/ucd/UnicodeData.txt`, {
  //     cacheKey: `v${ctx.emojiVersion}/unicode-names.json`,
  //     parser(data) {
  //       const lines = data.split("\n");
  //       const unicodeNames: Record<string, string> = {};

  //       for (const line of lines) {
  //         if (line.trim() === "" || line.startsWith("#")) {
  //           continue;
  //         }

  //         const [hex, name] = line.split(";").map((col) => col.trim());

  //         if (hex == null || name == null) {
  //           throw new Error(`invalid line: ${line}`);
  //         }

  //         unicodeNames[hex] = name;
  //       }

  //       return unicodeNames;
  //     },
  //     bypassCache: ctx.force,
  //   });
  // },
  // async shortcodes(ctx) {
  //   const providers = ctx.providers;

  //   if (providers.length === 0) {
  //     throw new Error("no shortcode providers specified");
  //   }

  //   const shortcodes: Partial<Record<ShortcodeProvider, EmojiShortcode[]>> = {};

  //   if (this.emojis == null) {
  //     throw new MojisNotImplemented("emojis");
  //   }

  //   const { emojis } = await this.emojis(ctx);

  //   const flattenedEmojis = Object.values(emojis).reduce((acc, subgroup) => {
  //     for (const hexcodes of Object.values(subgroup)) {
  //       for (const [hexcode, emoji] of Object.entries(hexcodes)) {
  //         acc[hexcode] = emoji;
  //       }
  //     }

  //     return acc;
  //   }, {} as Record<string, Emoji>);

  //   if (providers.includes("github")) {
  //     const githubShortcodesFn = await import("../shortcode/github").then((m) => m.generateGitHubShortcodes);

  //     shortcodes.github = await githubShortcodesFn({
  //       emojis: flattenedEmojis,
  //       force: ctx.force,
  //       version: ctx.emojiVersion,
  //     });
  //   }

  //   return shortcodes;
  // },
});
