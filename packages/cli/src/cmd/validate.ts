import type { CLIArguments } from "../cli-utils";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sourceHandlers } from "@mojis/adapters";
import { arktypeParse } from "@mojis/internal-utils";
import { green, red } from "farver/fast";
import { printHelp } from "../cli-utils";

export interface CLIValidateCmdOptions {
  flags: CLIArguments<{
    inputDir: string;
  }>;
  versions: string[];
}

export async function runValidate({ versions, flags }: CLIValidateCmdOptions) {
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

  const inputDir = flags.inputDir ?? "data";
  const versionsToValidate = versions.length > 0 ? versions : ["15.0"]; // Default to latest version

  // eslint-disable-next-line no-console
  console.log(`  ${green("validating emoji data...")}`);

  let hasErrors = false;

  for (const version of versionsToValidate) {
    const errors = await validateVersion(version, inputDir);

    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\n  ${red(`✖ validation failed for version ${version}:`)}`);
      for (const error of errors) {
        console.error(`    ${red("•")} ${error}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`  ${green(`✓ version ${version} validated successfully`)}`);
    }
  }

  if (hasErrors) {
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1);
  }
}

async function validateVersion(version: string, inputDir: string) {
  const versionDir = join(inputDir, `v${version}`);
  const errors: string[] = [];

  for (const [, adapter] of Object.entries(sourceHandlers)) {
    // For each schema defined in the adapter's persistence
    for (const [key, schema] of Object.entries(adapter.persistence.schemas)) {
      try {
        // Handle files that could match the pattern
        const files = await readdir(join(versionDir), { recursive: true });
        for (const file of files) {
          console.log(join(versionDir, file));
          const content = await readFile(join(versionDir, file), "utf-8");
          const data = JSON.parse(content);

          const result = arktypeParse(data, schema.schema);
          if (!result.success) {
            errors.push(`${file}: ${result.errors.join(", ")}`);
          }
        }
      } catch (err: any) {
        errors.push(`Failed to validate ${key}: ${err.message}`);
      }
    }
  }

  return errors;
}
