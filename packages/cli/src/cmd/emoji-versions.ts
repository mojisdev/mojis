import type { EmojiSpecRecord } from "@mojis/schemas/emojis";
import type { CLIArguments } from "../cli-utils";
import { getAllEmojiVersions, getLatestEmojiVersion } from "@mojis/versions";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../cli-utils";
import { writeFileSafe } from "../files";

export interface VersionOptions {
  flags: CLIArguments<{ drafts: boolean; force: boolean; format?: "table" | "json"; output?: string }>;
}

const EMOJI_VERSIONS_SUBCOMMANDS = [
  "latest",
  "all",
] as const;
export type Subcommand = (typeof EMOJI_VERSIONS_SUBCOMMANDS)[number];

function isValidSubcommand(subcommand: string): subcommand is Subcommand {
  return EMOJI_VERSIONS_SUBCOMMANDS.includes(subcommand as Subcommand);
}

export async function runEmojiVersions(subcommand: string, { flags }: VersionOptions) {
  if (!isValidSubcommand(subcommand) || flags?.help || flags?.h) {
    printHelp({
      commandName: "mojis emoji-versions",
      usage: "[command] [...flags]",
      tables: {
        Commands: [
          ["latest", "Get the latest version of all emojis"],
          ["all", "Get all versions of all emojis"],
        ],
        Flags: [
          ["--drafts", "Whether to include draft versions in the output."],
          ["--format", "The format of the output. (default: table) (options: table, json)"],
          ["--output", "The output file to write the results to. Output will always be in json format."],
          ["--force", "Force the output to be written to the output file even if it already exists."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const allVersions = await getAllEmojiVersions();

  const format = flags.format ?? "table";
  const output = flags.output;

  if (subcommand === "latest") {
    return printLatestVersion(getLatestEmojiVersion(allVersions, !!flags.drafts), format, output, !!flags.force);
  }

  if (subcommand === "all") {
    return printAllVersions(allVersions, !!flags.drafts, format, output, !!flags.force);
  }
  /* v8 ignore next 2 */
  throw new Error(`Invalid subcommand: ${subcommand}`);
}

function formatEmojiSpec(spec: EmojiSpecRecord): string {
  return ` ${yellow(spec.emoji_version).padEnd(15)}${spec.draft ? red("draft") : green("release")}`;
}

function transformOutput(versions: EmojiSpecRecord | EmojiSpecRecord[], format: "table" | "json"): string {
  if (Array.isArray(versions)) {
    if (format === "json") {
      return JSON.stringify(versions, null, 2);
    }

    return versions.map(formatEmojiSpec).join("\n");
  }

  if (format === "json") {
    return JSON.stringify(versions, null, 2);
  }
  return formatEmojiSpec(versions);
}

async function printLatestVersion(version: EmojiSpecRecord | null, format: "table" | "json", output?: string, force?: boolean) {
  if (version == null) {
    // eslint-disable-next-line no-console
    console.log("No emoji versions found.");
    return;
  }

  const formatted = transformOutput(version, output != null ? "json" : format);

  if (output != null) {
    await writeFileSafe(output, formatted, { force, encoding: "utf-8" });
    // eslint-disable-next-line no-console
    console.info(`${green("Successfully wrote to")} ${output}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(formatted);
}

async function printAllVersions(versions: EmojiSpecRecord[], includeDrafts: boolean, format: "table" | "json", output?: string, force?: boolean) {
  const filtered = includeDrafts ? versions : versions.filter((v) => !v.draft);

  if (filtered.length === 0) {
    // eslint-disable-next-line no-console
    console.log("No emoji versions found.");
    return;
  }

  const formatted = transformOutput(filtered, output != null ? "json" : format);

  if (output != null) {
    await writeFileSafe(output, formatted, { force, encoding: "utf-8" });
    // eslint-disable-next-line no-console
    console.info(`${green("Successfully wrote to")} ${output}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(formatted);
}
