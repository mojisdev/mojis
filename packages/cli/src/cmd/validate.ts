import type { CLIArguments } from "../cli-utils";
import { green } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIValidateCmdOptions {
  flags: CLIArguments<{
    inputDir: string;
  }>;
  versions: string[];
}

export async function runValidate({ versions: _providedVersions, flags }: CLIValidateCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Validate generated Emoji Data.",
      commandName: "mojis validate",
      usage: "<...versions> [...flags]",
      tables: {
        Flags: [
          ["--input-dir", "Specify the input directory."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`  ${green("validating emoji data...")}`);
}
