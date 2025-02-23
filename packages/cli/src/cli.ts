import process from "node:process";
import { getAllEmojiVersions } from "@mojis/internal-utils";
import { red, yellow } from "farver/fast";
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
    // .option("shortcode-providers", {
    //   type: "array",
    //   description: "shortcode providers to use",
    //   default: ["github"] satisfies InferInput<typeof SHORTCODE_PROVIDERS_SCHEMA>,
    // })
    .strict().help(),
  async (args) => {
    const _force = args.force ?? false;
    const _versions = Array.isArray(args.versions) ? args.versions : [args.versions];
    const _generators = Array.isArray(args.generators) ? args.generators : [args.generators];

    // const lockfile = await readLockfile();

    // if (lockfile == null) {
    //   consola.error("no lockfile found, run `mojis versions --write-lockfile` to generate one");
    //   process.exit(1);
    // }

    // function isGeneratorEnabled(generator: string) {
    //   return generators.includes(generator);
    // }

    // const unsupported = versions.filter((v) => !SUPPORTED_EMOJI_VERSIONS.includes(v));

    // // require that all versions are supported, otherwise exit
    // if (unsupported.length > 0) {
    //   consola.error(`version(s) ${unsupported.map((v) => yellow(v)).join(", ")} is not supported`);
    //   process.exit(1);
    // }

    // consola.info("generating emoji data for versions", versions.map((v) => yellow(v)).join(", "));
    // consola.info(`using the following generators ${args.generators.map((g) => yellow(g)).join(", ")}`);

    // const promises = versions.map(async (version) => {
    //   const coerced = semver.coerce(version);

    //   if (coerced == null) {
    //     throw new Error(`invalid version ${version}`);
    //   }

    //   const adapter = resolveAdapter(coerced.version);

    //   if (adapter == null) {
    //     throw new Error(`no adapter found for version ${version}`);
    //   }

    //   const lockfileMetadata = lockfile.versions.find((v) => v.emoji_version === version)?.metadata ?? {
    //     emojis: null,
    //     metadata: null,
    //     sequences: null,
    //     shortcodes: null,
    //     unicodeNames: null,
    //     variations: null,
    //     zwj: null,
    //   };

    //   if (isGeneratorEnabled("metadata")) {
    //     if (adapter.metadata == null) {
    //       throw new MojisNotImplemented("metadata");
    //     }

    //     const { groups, emojiMetadata } = await adapter.metadata({
    //       emojiVersion: version,
    //       force,
    //       unicodeVersion: getUnicodeVersionByEmojiVersion(version)!,
    //       lockfileMetadata,
    //     });

    //     await fs.ensureDir(`./data/v${version}/metadata`);

    //     await fs.writeFile(
    //       `./data/v${version}/groups.json`,
    //       JSON.stringify(groups, null, 2),
    //       "utf-8",
    //     );

    //     await Promise.all(Object.entries(emojiMetadata).map(([group, metadata]) => fs.writeFile(
    //       `./data/v${version}/metadata/${group}.json`,
    //       JSON.stringify(metadata, null, 2),
    //       "utf-8",
    //     )));
    //   }

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
    // });

    // const results = await Promise.allSettled(promises);

    // for (const result of results) {
    //   if (result.status === "rejected") {
    //     if (result.reason instanceof MojisNotImplemented) {
    //       consola.warn(result.reason.message);
    //       continue;
    //     }
    //     consola.error(result.reason);
    //   }
    // }

    // consola.info(green("done"));
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
    // eslint-disable-next-line ts/restrict-template-expressions
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
      // eslint-disable-next-line ts/restrict-template-expressions
      console.log(`updated ${yellow("emojis.lock")}`);
    }
  },
);

void cli.help().parse();

function commonOptions(args: Argv<object>): Argv<object & { force: boolean }> {
  return args.option("force", {
    type: "boolean",
    description: "bypass cache",
    default: false,
  });
}
