import type { EmojiSpecRecord } from "@mojis/schemas/emojis";
import type { CLIArguments } from "../cli-utils";
import path from "node:path";
import { runSourceAdapter, sourceHandlers } from "@mojis/adapters";
import mojiCompare from "@mojis/moji-compare";
import {
  getAllEmojiVersions,
  getLatestEmojiVersion,
  mapEmojiVersionToUnicodeVersion,
  OFFICIAL_SUPPORTED_VERSIONS,
} from "@mojis/versions";
import { green, yellow } from "farver/fast";
import fs from "fs-extra";
import { printHelp } from "../cli-utils";

interface GenerateOptions {
  flags: CLIArguments<{
    generators: string[];
    force: boolean;
    shortcodeProviders: string[];
    outputDir: string;
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
          ["--output-dir", "Specify the output directory."],
          ["--shortcode-providers [...providers]", `Specify the shortcode providers to use.`],
          ["--generators [...generators]", `Specify the generators to use.`],
          ["--force", "Force the operation to run, even if it's not needed."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line node/prefer-global/process
  const outputDir = flags.outputDir ?? path.join(process.cwd(), "data");
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
        .filter((v) => mojiCompare.lt(`${v.emoji_version}.0`, `${version.emoji_version}.0`))
        .sort((a, b) => mojiCompare.compareSortable(`${b.emoji_version}.0`, `${a.emoji_version}.0`));

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
  const promises = versions.map((version) => buildEmojiGenerateRequest({
    version,
    generators,
    force,
    outputDir,
  }));

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

interface EmojiDataGenerateRequest {
  /**
   * The version of the emoji data to generate.
   */
  version: EmojiSpecRecord;

  /**
   * The generators to use for the emoji data generation.
   */
  generators: string[];

  /**
   * Whether to force the generation of the emoji data.
   */
  force: boolean;

  /**
   * The output directory for the generated emoji data.
   */
  outputDir: string;
}

/**
 * Builds a request for the emoji data generation.
 * @param {EmojiDataGenerateRequest} options - The options for the emoji data generation.
 * @param {string} options.version - The version of the emoji data to generate.
 * @param {string[]} options.generators - The generators to use for the emoji data generation.
 * @param {boolean} options.force - Whether to force the generation of the emoji data.
 * @param {string} options.outputDir - The output directory for the generated emoji data.
 * @returns {Promise<void>} A promise that resolves to the emoji data.
 */
export async function buildEmojiGenerateRequest(options: EmojiDataGenerateRequest): Promise<void> {
  const { version, generators, force, outputDir } = options;
  const baseDir = path.join(`${outputDir}/v${version.emoji_version}`);
  await fs.ensureDir(baseDir);

  if (isGeneratorEnabled("metadata", generators)) {
    await runSourceAdapter(sourceHandlers.metadataHandler, {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    }, {
      outputDir,
    });
  }

  if (isGeneratorEnabled("sequences", generators)) {
    await runSourceAdapter(sourceHandlers.sequencesHandler, {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    }, {
      outputDir,
    });
  }

  if (isGeneratorEnabled("variations", generators)) {
    await runSourceAdapter(sourceHandlers.variationsHandler, {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    }, {
      outputDir,
    });
  }

  if (isGeneratorEnabled("unicode-names", generators)) {
    await runSourceAdapter(sourceHandlers.unicodeNamesHandler, {
      force,
      emoji_version: version.emoji_version,
      unicode_version: version.unicode_version,
    }, {
      outputDir,
    });
  }
}
