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
  // TODO: find a better name for versions
  | "versions"
  | "generate";

/**
 * Resolves the CLI command based on the provided flags.
 *
 * @param {string} flags - The parsed command-line arguments from yargs.
 * @returns {CLICommand} A `CLICommand` representing the resolved command.
 *          If the `--version` flag is present, returns "version".
 *          If the command is supported, returns the command string.
 *          Otherwise, returns "help" as the default command.
 */
function resolveCommand(flags: yargs.Arguments): CLICommand {
  const cmd = flags._[2] as string;
  if (flags.version) return "version";

  const supportedCommands = new Set([
    "generate",
    "versions",
  ]);

  if (supportedCommands.has(cmd)) {
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

async function runCommand(cmd: string, flags: yargs.Arguments) {
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
      return;
    case "version":
      // eslint-disable-next-line no-console
      console.log();
      // eslint-disable-next-line no-console
      console.log(`  ${bgGreen(black(` mojis `))} ${green(`v${pkg.version ?? "x.y.z"}`)}`);
      return;
    case "versions": {
      const { runVersions } = await import("./cmd/versions");
      await runVersions({
        flags,
      });
      return;
    }
    case "generate": {
      const { runGenerate } = await import("./cmd/generate");
      const versions = flags._.slice(3) as string[];
      await runGenerate({
        versions,
        flags,
      });
      return;
    }
  }

  throw new Error(`Error running ${cmd} -- no command found.`);
}

export async function cli(argv: string[]) {
  const flags = yargs(argv, {
    configuration: {
      "parse-positional-numbers": false,
    },
    array: ["generators", "shortcode-providers"],
    boolean: ["force", "write-lockfile"],
    default: {
      "generators": ["metadata"],
      "shortcode-providers": ["github"],
    },
  });
  const cmd = resolveCommand(flags);
  try {
    await runCommand(cmd, flags);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
