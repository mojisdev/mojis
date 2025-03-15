import process from "node:process";
import yargs from "yargs-parser";
import { resolveCommand, runCommand } from "./cli-utils";
import { DEFAULT_GENERATORS, DEFAULT_SHORTCODE_PROVIDERS } from "./constants";

export async function cli(args: string[]): Promise<void> {
  try {
    const flags = yargs(args, {
      configuration: {
        "parse-positional-numbers": false,
      },
      array: ["generators", "shortcode-providers"],
      boolean: ["force", "drafts"],
      default: {
        "generators": DEFAULT_GENERATORS,
        "shortcode-providers": DEFAULT_SHORTCODE_PROVIDERS,
        "force": false,
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
