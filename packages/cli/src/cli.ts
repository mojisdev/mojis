import process from "node:process";
import yargs from "yargs-parser";
import { resolveCommand, runCommand } from "./cli-utils";

export async function cli(args: string[]): Promise<void> {
  try {
    const flags = yargs(args, {
      configuration: {
        "parse-positional-numbers": false,
        "camel-case-expansion": false,
      },
      array: ["generators", "shortcode-providers"],
      boolean: ["force", "write-lockfile"],
      default: {
        "generators": ["metadata"],
        "shortcode-providers": ["github"],
        "force": false,
        "write-lockfile": false,
      },
    });

    const cmd = resolveCommand(flags);
    await runCommand(cmd, flags);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cli(process.argv);
