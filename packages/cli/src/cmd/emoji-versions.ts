import type { CLIArguments } from "../cli-utils";
import { getAllEmojiVersions } from "@mojis/internal-utils";
import { red, yellow } from "farver/fast";
import semver from "semver";
import { printHelp } from "../cli-utils";
import { readLockfile, writeLockfile } from "../lockfile";

interface VersionOptions {
  flags: CLIArguments<{
    writeLockfile: boolean;
    force: boolean;
  }>;
}

export async function runEmojiVersions({ flags }: VersionOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      commandName: "mojis versions",
      usage: "[...flags]",
      tables: {
        Flags: [
          ["--write-lockfile", `Write the lockfile with the latest version.`],
          ["--force", "Force the operation to run, even if it's not needed."],
          ["--help (-h)", "See all available flags."],
        ],
      },
      description: `Print all emoji versions available.`,
    });
  }

  const versions = await getAllEmojiVersions();

  // eslint-disable-next-line no-console
  console.log("all available versions:");
  // eslint-disable-next-line no-console
  console.log(versions.map((v) => `${yellow(v.emoji_version)}${v.draft ? ` ${red("(draft)")}` : ""}`).join(", "));

  if (flags.writeLockfile) {
    const sortedVersions = versions.filter((v) => !v.draft).sort((a, b) => semver.rcompare(a.unicode_version, b.unicode_version));

    if (sortedVersions.length === 0 || sortedVersions[0] == null) {
      console.warn("no stable versions found, skipping lockfile update");
      return;
    }

    const latestVersion = sortedVersions[0].emoji_version;

    const lockfile = await readLockfile();

    lockfile.versions = Array.from(versions);
    lockfile.latest_version = latestVersion;

    await writeLockfile(lockfile);
    // eslint-disable-next-line no-console
    console.log(`updated ${yellow("emojis.lock")}`);
  }
}
