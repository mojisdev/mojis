import type { SHORTCODE_PROVIDERS_SCHEMA } from "@mojis/internal-utils/schemas";
import type { z } from "zod";
import process from "node:process";
import { resolveAdapter } from "@mojis/adapters";
import {
  type EmojiVersion,
  getAllEmojiVersions,
  getLatestEmojiVersion,
  mapEmojiVersionToUnicodeVersion,
  MojisNotImplemented,
} from "@mojis/internal-utils";
import { green, red, yellow } from "farver/fast";
import fs from "fs-extra";
import semver from "semver";
import yargs, { type Argv } from "yargs";
import pkg from "../package.json" with { type: "json" };
import { readLockfile, writeLockfile } from "./lockfile";

const cli = yargs(process.argv.slice(2))
  .scriptName("mojis")
  .usage("$0 [args]")
  .version(pkg.version ?? "0.0.0")
  .strict()
  .showHelpOnFail(true)
  .alias("h", "help")
  .alias("v", "version")
  .demandCommand(1, "");

cli.command(
  "generate <versions...>",
  "generate emoji data for the specified versions",
  (args) => commonOptions(args)
    .positional("versions", {
      type: "string",
      description: "emoji versions to generate",
    })
    .option("generators", {
      type: "array",
      description: "generators to use",
      default: ["metadata", "sequences", "variations", "emojis", "shortcodes"],
    })
    .option("shortcode-providers", {
      type: "array",
      description: "shortcode providers to use",
      default: ["github"] satisfies z.infer<typeof SHORTCODE_PROVIDERS_SCHEMA>,
    })
    .strict().help(),
  async (args) => {
    const force = args.force ?? false;
    const existingEmojiVersions = await getAllEmojiVersions();

    let providedVersions = (Array.isArray(args.versions) ? args.versions : [args.versions]) as string[];

    const generators = Array.isArray(args.generators) ? args.generators : [args.generators];

    const lockfile = await readLockfile();

    if (lockfile == null) {
      console.error("no lockfile found, run `mojis versions --write-lockfile` to generate one");
      process.exit(1);
    }

    function isGeneratorEnabled(generator: string) {
      return generators.includes(generator);
    }

    // If provided versions contains any of the non existing versions, filter them out.
    // if they are the only versions provided, exit with an error.
    if (providedVersions.some((v) => !existingEmojiVersions.some((ev) => ev.emoji_version === v))) {
      const unsupported = providedVersions.filter((v) => !existingEmojiVersions.some((ev) => ev.emoji_version === v));

      if (unsupported.length === providedVersions.length) {
        console.error(`version(s) ${unsupported.map((v) => yellow(v)).join(", ")} is not supported, since they don't exist.`);
        // TODO: add a note about why.
        process.exit(1);
      }

      providedVersions = providedVersions.filter((v) => !unsupported.includes(v));
    }

    const versions = providedVersions.map((v) => ({
      emoji_version: v,
      unicode_version: mapEmojiVersionToUnicodeVersion(v),
      draft: existingEmojiVersions.find((ev) => ev.emoji_version === v)?.draft ?? false,
      fallback: null as string | null,
    })) satisfies EmojiVersion[];

    // print out the versions that we don't officially support,
    // which will fallback to using a different version adapter.

    // TODO: probably move this to a different location.
    const OFFICIAL_SUPPORTED_VERSIONS = [
      "1.0",
      "2.0",
      "3.0",
      "4.0",
      "5.0",
      "11.0",
      "12.0",
      "12.1",
      "13.0",
      "13.1",
      "14.0",
      "15.0",
      "15.1",
      "16.0",
    ];

    // TODO: prevent issues where the fallback is pointing to a version that doesn't exist.

    const notOfficialSupported = versions.filter((v) => !OFFICIAL_SUPPORTED_VERSIONS.includes(v.emoji_version));

    // warn about using a not officially supported version
    if (notOfficialSupported.length > 0) {
      console.warn(`version(s) ${notOfficialSupported.map((v) => yellow(v.emoji_version)).join(", ")} is not officially supported`);

      // set the fallback for each of the versions that are not officially supported
      for (const version of notOfficialSupported) {
        // get the version that comes right before the version that is not officially supported
        const previousVersion = existingEmojiVersions.find((v) => semver.lt(`${v.emoji_version}.0`, `${version.emoji_version}.0`));

        // set the fallback to the previous version if it exists, otherwise use the latest supported version.
        const found = versions.find((v) => v.emoji_version === version.emoji_version);

        if (found == null) {
          throw new Error(`version ${version.emoji_version} not found`);
        }

        if (previousVersion != null && previousVersion.emoji_version != null) {
          found.fallback = previousVersion.emoji_version;
        } else {
          const latest = getLatestEmojiVersion(existingEmojiVersions);

          if (latest == null) {
            throw new Error("no latest version found");
          }

          found.fallback = latest.emoji_version;
        }
      }

      console.warn(`will use the following fallbacks: ${notOfficialSupported.map((v) => `${yellow(v.emoji_version)} -> ${yellow(v.fallback)}`).join(", ")}`);
    }

    console.log("versions", versions);
    console.log("existingEmojiVersions", existingEmojiVersions);

    console.info("generating emoji data for versions", versions.map((v) => yellow(v.emoji_version)).join(", "));
    console.info(`using the following generators ${args.generators.map((g) => yellow(g)).join(", ")}`);

    const promises = versions.map(async (version) => {
      const adapter = resolveAdapter(version);

      if (adapter == null) {
        throw new Error(`no adapter found for version ${version.emoji_version}`);
      }

      if (isGeneratorEnabled("metadata")) {
        if (adapter.metadata == null) {
          throw new MojisNotImplemented("metadata");
        }

        const metadataResult = await adapter.metadata({
          force,
          versions: version,
        });

        await fs.ensureDir(`./data/v${version.emoji_version}/metadata`);

        console.log("metadataResult", metadataResult);

        // await fs.writeFile(
        //   `./data/v${version.emoji_version}/groups.json`,
        //   JSON.stringify(groups, null, 2),
        //   "utf-8",
        // );

        // await Promise.all(Object.entries(emojiMetadata).map(async ([group, metadata]) => fs.writeFile(
        //   `./data/v${version.emoji_version}/metadata/${group}.json`,
        //   JSON.stringify(metadata, null, 2),
        //   "utf-8",
        // )));
      }

      //   if (isGeneratorEnabled("sequences")) {
      //     if (adapter.sequences == null) {
      //       throw new MojisNotImplemented("sequences");
      //     }

      //     const { sequences, zwj } = await adapter.sequences({
      //       emojiVersion: version,
      //       force,
      //       unicodeVersion: getUnicodeVersionByEmojiVersion(version)!,
      //       lockfileMetadata,
      //     });

      //     await fs.ensureDir(`./data/v${version}`);

      //     await fs.writeFile(
      //       `./data/v${version}/zwj-sequences.json`,
      //       JSON.stringify(zwj, null, 2),
      //       "utf-8",
      //     );

      //     await fs.writeFile(
      //       `./data/v${version}/sequences.json`,
      //       JSON.stringify(sequences, null, 2),
      //       "utf-8",
      //     );
      //   }

      //   if (isGeneratorEnabled("variations")) {
      //     if (adapter.variations == null) {
      //       throw new MojisNotImplemented("variations");
      //     }

      //     const variations = await adapter.variations({
      //       emojiVersion: version,
      //       force,
      //       unicodeVersion: getUnicodeVersionByEmojiVersion(version)!,
      //       lockfileMetadata,
      //     });

      //     await fs.ensureDir(`./data/v${version}`);
      //     await fs.writeFile(
      //       `./data/v${version}/variations.json`,
      //       JSON.stringify(variations, null, 2),
      //       "utf-8",
      //     );
      //   }

      //   if (isGeneratorEnabled("emojis")) {
      //     if (adapter.emojis == null) {
      //       throw new MojisNotImplemented("emojis");
      //     }

      //     const { emojiData, emojis } = await adapter.emojis({
      //       emojiVersion: version,
      //       force,
      //       unicodeVersion: getUnicodeVersionByEmojiVersion(version)!,
      //       lockfileMetadata,
      //     });

      //     await fs.ensureDir(`./data/v${version}`);

      //     await fs.writeFile(
      //       `./data/v${version}/emoji-data.json`,
      //       JSON.stringify(emojiData, null, 2),
      //       "utf-8",
      //     );

      //     for (const [group, subgroup] of Object.entries(emojis)) {
      //       await fs.ensureDir(`./data/v${version}/emojis/${group}`);

      //       for (const hexcodes of Object.values(subgroup)) {
      //         await fs.ensureDir(`./data/v${version}/emojis/${group}/${subgroup}`);

      //         for (const [hexcode, emoji] of Object.entries(hexcodes)) {
      //           await fs.writeFile(
      //             `./data/v${version}/emojis/${group}/${subgroup}/${hexcode}.json`,
      //             JSON.stringify(emoji, null, 2),
      //             "utf-8",
      //           );
      //         }
      //       }
      //     }
      //   }

      //   if (isGeneratorEnabled("shortcodes")) {
      //     const providers = await parseAsync(SHORTCODE_PROVIDERS_SCHEMA, args["shortcode-providers"]);

      //     if (providers.length === 0) {
      //       throw new Error("no shortcode providers specified");
      //     }

      //     if (adapter.shortcodes == null) {
      //       throw new MojisNotImplemented("shortcodes");
      //     }

      //     const shortcodes = await adapter.shortcodes({
      //       emojiVersion: version,
      //       force,
      //       unicodeVersion: getUnicodeVersionByEmojiVersion(version)!,
      //       providers,
      //       lockfileMetadata,
      //     });

      //     await fs.ensureDir(`./data/v${version}/shortcodes`);

      //     for (const provider of providers) {
      //       if (shortcodes[provider] == null) {
      //         consola.warn(`no shortcodes found for provider ${provider}`);
      //         continue;
      //       }

      //       await fs.writeFile(
      //         `./data/v${version}/shortcodes/${provider}.json`,
      //         JSON.stringify(shortcodes[provider], null, 2),
      //         "utf-8",
      //       );
      //     }
      //   }
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "rejected") {
        if (result.reason instanceof MojisNotImplemented) {
          console.warn(result.reason.message);
          continue;
        }
        console.error(result.reason);
      }
    }

    console.info(green("done"));
  },
);

cli.command(
  "versions",
  "Print all emoji versions available",
  (args) => commonOptions(args)
    .option("write-lockfile", {
      type: "boolean",
      default: false,
      description: "update the lockfile with the available versions",
    }).strict().help(),
  async (args) => {
    const versions = await getAllEmojiVersions();

    console.log("all available versions:");
    console.log(versions.map((v) => `${yellow(v.emoji_version)}${v.draft ? ` ${red("(draft)")}` : ""}`).join(", "));

    if (args.writeLockfile) {
      const sortedVersions = versions.filter((v) => !v.draft).sort((a, b) => semver.rcompare(a.unicode_version, b.unicode_version));

      if (sortedVersions.length === 0 || sortedVersions[0] == null) {
        console.warn("no stable versions found, skipping lockfile update");
        return;
      }

      const latestVersion = sortedVersions[0].emoji_version;

      const lockfile = await readLockfile();

      lockfile.versions = Array.from(versions);
      lockfile.latest_version = latestVersion;

      await writeLockfile(lockfile);
      console.log(`updated ${yellow("emojis.lock")}`);
    }
  },
);

cli.help().parse();

function commonOptions(args: Argv<object>): Argv<object & { force: boolean }> {
  return args.option("force", {
    type: "boolean",
    description: "bypass cache",
    default: false,
  });
}
