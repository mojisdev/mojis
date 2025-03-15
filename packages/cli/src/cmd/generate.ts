import type { EmojiSpecRecord } from "@mojis/internal-utils";
import type { CLIArguments } from "../cli-utils";
import { join } from "node:path";
import { runAdapterHandler } from "@mojis/adapters";
import {
  getAllEmojiVersions,
  getLatestEmojiVersion,
  mapEmojiVersionToUnicodeVersion,
  OFFICIAL_SUPPORTED_VERSIONS,
} from "@mojis/internal-utils";
import { green, yellow } from "farver/fast";
import fs from "fs-extra";
import semver from "semver";
import { printHelp } from "../cli-utils";

interface GenerateOptions {
  flags: CLIArguments<{
    generators: string[];
    force: boolean;
    shortcodeProviders: string[];
  }>;
  versions: string[];
}

export async function runGenerate({ versions: providedVersions, flags }: GenerateOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Generate emoji data for the specified versions.",
      commandName: "mojis generate",
      usage: "<...versions> [...flags]",
      tables: {
        Flags: [
          ["--shortcode-providers [...providers]", `Specify the shortcode providers to use.`],
          ["--generators [...generators]", `Specify the generators to use.`],
          ["--force", "Force the operation to run, even if it's not needed."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const force = flags.force ?? false;
  const existingEmojiVersions = await getAllEmojiVersions();
  const generators = (Array.isArray(flags.generators) ? flags.generators : [flags.generators]) as string[];

  // If provided versions contains any of the non existing versions, filter them out.
  // if they are the only versions provided, exit with an error.
  if (providedVersions.some((v) => !existingEmojiVersions.some((ev) => ev.emoji_version === v))) {
    const unsupported = providedVersions.filter((v) => !existingEmojiVersions.some((ev) => ev.emoji_version === v));

    if (unsupported.length === providedVersions.length) {
      console.error(`version(s) ${unsupported.map((v) => yellow(v)).join(", ")} is not supported, since they don't exist.`);
      // eslint-disable-next-line node/prefer-global/process
      process.exit(1);
    }

    providedVersions = providedVersions.filter((v) => !unsupported.includes(v));
  }

  const versions = providedVersions.map((v) => ({
    emoji_version: v,
    unicode_version: mapEmojiVersionToUnicodeVersion(v),
    draft: existingEmojiVersions.find((ev) => ev.emoji_version === v)?.draft ?? false,
    fallback: null as string | null,
  })) satisfies EmojiSpecRecord[];

  // Handle unsupported versions
  const notOfficialSupported = versions.filter((v) => !OFFICIAL_SUPPORTED_VERSIONS.includes(v.emoji_version));

  if (notOfficialSupported.length > 0) {
    console.warn(`version(s) ${notOfficialSupported.map((v) => yellow(v.emoji_version)).join(", ")} is not officially supported`);

    // Set fallbacks for unsupported versions
    for (const version of notOfficialSupported) {
      const sortedVersions = [...existingEmojiVersions]
        .filter((v) => semver.lt(`${v.emoji_version}.0`, `${version.emoji_version}.0`))
        .sort((a, b) => semver.compare(`${b.emoji_version}.0`, `${a.emoji_version}.0`));

      const previousVersion = sortedVersions[0];
      const found = versions.find((v) => v.emoji_version === version.emoji_version);

      if (found == null) {
        throw new Error(`version ${version.emoji_version} not found`);
      }

      if (previousVersion != null && previousVersion.emoji_version != null) {
        found.fallback = previousVersion.emoji_version;
      } else {
        const latest = getLatestEmojiVersion(existingEmojiVersions, false);

        if (latest == null) {
          throw new Error("no latest version found");
        }

        found.fallback = latest.emoji_version;
      }
    }

    console.warn(`will use the following fallbacks: ${notOfficialSupported.map((v) => `${yellow(v.emoji_version)} -> ${yellow(v.fallback)}`).join(", ")}`);
  }

  // eslint-disable-next-line no-console
  console.info("generating emoji data for versions", versions.map((v) => yellow(v.emoji_version)).join(", "));
  // eslint-disable-next-line no-console
  console.info(`using the following generators ${generators.map((g) => yellow(g)).join(", ")}`);

  // generate the promises for each version
  const promises = versions.map((version) => buildEmojiGenerateRequest(version, generators, force));

  const results = await Promise.allSettled(promises);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(result.reason);
    }
  }

  // eslint-disable-next-line no-console
  console.info(green("done"));
}

function isGeneratorEnabled(generator: string, generators: string[]): boolean {
  return generators.includes(generator);
}

/**
 * Builds a request for the emoji data generation.
 * @param {EmojiSpecRecord} version - The version of the emoji data to generate.
 * @param {string[]} generators - The generators to use.
 * @param {boolean} force - Whether to force the generation.
 * @returns {Promise<void>} A promise that resolves to the emoji data.
 */
export async function buildEmojiGenerateRequest(
  version: EmojiSpecRecord,
  generators: string[],
  force: boolean,
): Promise<void> {
  const baseDir = `./data/v${version.emoji_version}`;
  await fs.ensureDir(baseDir);

  if (isGeneratorEnabled("metadata", generators)) {
    const { groups, emojis } = await runAdapterHandler("metadata", {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    });

    await fs.ensureDir(join(baseDir, "metadata"));

    await fs.writeFile(
      join(baseDir, "groups.json"),
      JSON.stringify(groups, null, 2),
      "utf-8",
    );

    await Promise.all(Object.entries(emojis).map(async ([group, metadata]) => fs.writeFile(
      join(baseDir, "metadata", `${group}.json`),
      JSON.stringify(metadata, null, 2),
      "utf-8",
    )));
  }

  if (isGeneratorEnabled("sequences", generators)) {
    const { sequences, zwj } = await runAdapterHandler("sequences", {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    });

    await fs.writeFile(
      join(baseDir, "zwj-sequences.json"),
      JSON.stringify(zwj, null, 2),
      "utf-8",
    );

    await fs.writeFile(
      join(baseDir, "sequences.json"),
      JSON.stringify(sequences, null, 2),
      "utf-8",
    );
  }

  if (isGeneratorEnabled("variations", generators)) {
    const variations = await runAdapterHandler("variations", {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    });

    await fs.writeFile(
      join(baseDir, "variations.json"),
      JSON.stringify(variations, null, 2),
      "utf-8",
    );
  }

  if (isGeneratorEnabled("unicode-names", generators)) {
    const unicodeNames = await runAdapterHandler("unicode-names", {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    });

    await fs.writeFile(
      join(baseDir, "unicode-names.json"),
      JSON.stringify(unicodeNames, null, 2),
      "utf-8",
    );
  }
}
