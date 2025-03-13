import type { Arguments } from "yargs-parser";
import process from "node:process";
import {
  bgGreen,
  bgWhite,
  black,
  bold,
  dim,
  green,
} from "farver/fast";
import yargs from "yargs-parser";
import pkg from "../package.json" with { type: "json" };

type CLICommand =
  | "help"
  | "version"
  | "versions"
  | "generate";

const SUPPORTED_COMMANDS = new Set<CLICommand>([
  "generate",
  "versions",
]);

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
  const linebreak = () => "";
  const title = (label: string) => `  ${bgWhite(black(` ${label} `))}`;
  const table = (rows: [string, string][], { padding }: { padding: number }) => {
    const split = process.stdout.columns < 60;
    let raw = "";

    for (const row of rows) {
      if (split) {
        raw += `    ${row[0]}\n    `;
      } else {
        raw += `${`${row[0]}`.padStart(padding)}`;
      }
      raw += `  ${dim(row[1])}\n`;
    }

    return raw.slice(0, -1); // remove latest \n
  };

  const message = [];

  if (headline) {
    message.push(
      linebreak(),
      `  ${bgGreen(black(` ${commandName} `))} ${green(
        `v${pkg.version ?? "x.y.z"}`,
      )} ${headline}`,
    );
  }

  if (usage) {
    message.push(linebreak(), `  ${green(commandName)} ${bold(usage)}`);
  }

  if (tables) {
    function calculateTablePadding(rows: [string, string][]) {
      return rows.reduce((val, [first]) => Math.max(val, first.length), 0) + 2;
    }

    const tableEntries = Object.entries(tables);
    const padding = Math.max(...tableEntries.map(([, rows]) => calculateTablePadding(rows)));
    for (const [tableTitle, tableRows] of tableEntries) {
      message.push(linebreak(), title(tableTitle), table(tableRows, { padding }));
    }
  }

  if (description) {
    message.push(linebreak(), `${description}`);
  }

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
            ["versions", "Print all emoji versions available."],
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
    case "versions": {
      const { runVersions } = await import("./cmd/versions");
      await runVersions({
        flags,
      });
      break;
    }
    case "generate": {
      const { runGenerate } = await import("./cmd/generate");
      const versions = flags._.slice(3) as string[];
      await runGenerate({
        versions,
        flags,
      });
      break;
    }
    default:
      throw new Error(`Error running ${cmd} -- no command found.`);
  }
}
