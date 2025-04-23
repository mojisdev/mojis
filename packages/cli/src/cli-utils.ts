import type { Arguments } from "yargs-parser";
import type { CLIGenerateCmdOptions } from "./cmd/generate";
import type { CLIValidateCmdOptions } from "./cmd/validate";
import process from "node:process";
import {
  bgGreen,
  black,
  bold,
  dim,
  green,
} from "farver/fast";
import yargs from "yargs-parser";
import pkg from "../package.json" with { type: "json" };
import { DEFAULT_GENERATORS, DEFAULT_SHORTCODE_PROVIDERS } from "./constants";

type CLICommand =
  | "help"
  | "version"
  | "emoji-versions"
  | "generate"
  | "validate";

const SUPPORTED_COMMANDS = new Set<CLICommand>([
  "generate",
  "emoji-versions",
  "validate",
]);

export type CLIArguments<T extends Record<string, unknown>> = Arguments & T;

/**
 * Resolves the CLI command based on the provided arguments.
 *
 * If the `version` flag is present, it returns the "version" command.
 * Otherwise, it checks if the third argument in the positional arguments (`flags._[2]`)
 * is a supported command. If it is, it returns that command.
 * If no supported command is found, it defaults to the "help" command.
 *
 * @param {Arguments} flags - The parsed arguments from the command line.
 * @returns {CLICommand} The resolved CLI command.
 */
export function resolveCommand(flags: Arguments): CLICommand {
  if (flags.version) return "version";

  const cmd = flags._[2] as string;

  if (SUPPORTED_COMMANDS.has(cmd as CLICommand)) {
    return cmd as CLICommand;
  }

  return "help";
}

export function printHelp({
  commandName,
  headline,
  usage,
  tables,
  description,
}: {
  commandName: string;
  headline?: string;
  usage?: string;
  tables?: Record<string, [command: string, help: string][]>;
  description?: string;
}) {
  const terminalWidth = process.stdout.columns || 80;
  const isTinyTerminal = terminalWidth < 60;

  // add two spaces before all content
  const indent = "  ";

  // helper functions
  const linebreak = () => "";

  // table rendering with improved spacing
  const table = (rows: [string, string][], { padding }: { padding: number }) => {
    let raw = "";

    for (const [command, help] of rows) {
      if (isTinyTerminal) {
        // stack vertically in small terminals
        raw += `${indent}${indent}${bold(command)}\n${indent}${indent}${indent}${dim(help)}\n`;
      } else {
        // keep horizontal in normal terminals with better alignment
        const paddedCommand = command.padEnd(padding);
        raw += `${indent}${indent}${bold(paddedCommand)}  ${dim(help)}\n`;
      }
    }
    return raw.slice(0, -1); // remove latest \n
  };

  const message = [];

  // header section with version
  if (headline) {
    message.push(
      `\n${indent}${bgGreen(black(` ${commandName} `))} ${green(`v${pkg.version ?? "0.0.0"}`)}`,
      `${indent}${dim(headline)}`,
    );
  }

  // usage section
  if (usage) {
    message.push(
      linebreak(),
      `${indent}${bold("USAGE")}`,
      `${indent}${indent}${green(commandName)} ${usage}`,
    );
  }

  // description when provided
  if (description) {
    message.push(
      linebreak(),
      `${indent}${bold("DESCRIPTION")}`,
      `${indent}${indent}${description}`,
    );
  }

  // tables with improved formatting
  if (tables) {
    // calculate optimal padding but cap it to avoid excessive space
    function calculateTablePadding(rows: [string, string][]) {
      const maxLength = rows.reduce((val, [first]) => Math.max(val, first.length), 0);
      return Math.min(maxLength, 30) + 2;
    }

    const tableEntries = Object.entries(tables);
    for (const [tableTitle, tableRows] of tableEntries) {
      const padding = calculateTablePadding(tableRows);
      message.push(
        linebreak(),
        `${indent}${bold(tableTitle.toUpperCase())}`,
        table(tableRows, { padding }),
      );
    }
  }

  // add footer
  message.push(
    linebreak(),
    `${indent}${dim(`Run with --help for more information on specific commands.`)}`,
  );

  // eslint-disable-next-line no-console
  console.log(`${message.join("\n")}\n`);
}

/**
 * Runs a command based on the provided CLI command and flags.
 *
 * @param {CLICommand} cmd - The CLI command to execute.
 * @param {Arguments} flags - The flags passed to the command.
 * @returns {Promise<void>} A promise that resolves when the command has finished executing.
 * @throws An error if the command is not found.
 */
export async function runCommand(cmd: CLICommand, flags: Arguments): Promise<void> {
  switch (cmd) {
    case "help":
      printHelp({
        commandName: "mojis",
        headline: "The CLI for managing emoji data",
        usage: "[command] [...flags]",
        tables: {
          "Commands": [
            ["generate", "Generate emoji data for the specified versions."],
            ["emoji-versions", "Print all emoji versions available."],
            ["validate", "Validate generated emoji data."],
          ],
          "Global Flags": [
            ["--force", "Force the operation to run, even if it's not needed."],
            ["--version", "Show the version number and exit."],
            ["--help", "Show this help message."],
          ],
        },
      });
      break;
    case "version":
      // eslint-disable-next-line no-console
      console.log(`  ${bgGreen(black(` mojis `))} ${green(`v${pkg.version ?? "x.y.z"}`)}`);
      break;
    case "emoji-versions": {
      const { runEmojiVersions } = await import("./cmd/emoji-versions");

      const subcommand = flags._[3]?.toString() ?? "";
      await runEmojiVersions(subcommand, {
        flags: flags as CLIArguments<{
          drafts: boolean;
          force: boolean;
        }>,
      });
      break;
    }
    case "validate": {
      const { runValidate } = await import("./cmd/validate");
      const versions = flags._.slice(3) as string[];
      await runValidate({
        versions,
        flags: flags as CLIValidateCmdOptions["flags"],
      });
      break;
    }
    case "generate": {
      const { runGenerate } = await import("./cmd/generate");
      const versions = flags._.slice(3) as string[];
      await runGenerate({
        versions,
        flags: flags as CLIGenerateCmdOptions["flags"],
      });
      break;
    }
    default:
      throw new Error(`Error running ${cmd} -- no command found.`);
  }
}

export function parseFlags(args: string[]) {
  return yargs(args, {
    configuration: {
      "parse-positional-numbers": false,
    },
    string: ["output-dir", "input-dir"],
    array: ["generators", "shortcode-providers"],
    boolean: ["force", "drafts"],
    default: {
      "output-dir": "./data",
      "generators": DEFAULT_GENERATORS,
      "shortcode-providers": DEFAULT_SHORTCODE_PROVIDERS,
      "force": false,
      "drafts": false,
    },
  });
}

export async function runCLI(args: string[]): Promise<void> {
  try {
    const flags = parseFlags(args);

    const cmd = resolveCommand(flags);
    await runCommand(cmd, flags);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
