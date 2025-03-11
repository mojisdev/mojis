import path from "node:path";
import process from "node:process";
import { ARKTYPE_EMOJI_SPEC_RECORD_SCHEMA } from "@mojis/internal-utils/schemas";
import { type } from "arktype";
import fs from "fs-extra";

const LOCKFILE_SCHEMA = type({
  latest_version: "string | null",
  versions: ARKTYPE_EMOJI_SPEC_RECORD_SCHEMA.array(),
});

export type EmojiLockfile = typeof LOCKFILE_SCHEMA.infer;

const DEFAULT_LOCKFILE = {
  versions: [],
  latest_version: null,
} satisfies EmojiLockfile;

/**
 * Reads and parses the emoji lockfile from the current directory.
 * If the file doesn't exist, returns the default lockfile structure.
 *
 * @param {string} cwd - The directory to read the lockfile from
 *
 * @returns {Promise<EmojiLockfile>} Promise that resolves to the parsed emoji lockfile configuration
 * @throws {Error} If the lockfile exists but contains invalid data
 */
export async function readLockfile(cwd: string = process.cwd()): Promise<EmojiLockfile> {
  const json = await fs.readJSON(path.join(cwd, "emojis.lock")).catch(() => DEFAULT_LOCKFILE);
  const out = LOCKFILE_SCHEMA(json);

  return out instanceof type.errors ? out.throw() : out;
}

/**
 * Writes the emoji lockfile to disk after validating its contents.
 *
 * @param {EmojiLockfile} lockfile - The emoji lockfile object to write
 * @param {string} cwd - The directory to write the lockfile to
 *
 * @throws {Error} If the lockfile validation fails
 * @returns {Promise<void>} A promise that resolves when the file is written
 */
export async function writeLockfile(lockfile: EmojiLockfile, cwd: string = process.cwd()): Promise<void> {
  const out = LOCKFILE_SCHEMA(lockfile);

  if (out instanceof type.errors) {
    out.throw();
  } else {
    await fs.writeJSON(path.join(cwd, "emojis.lock"), out, { spaces: 2 });
  }
}

/**
 * Checks if an emoji lockfile exists in the current directory.
 * The lockfile is used to track the installed emojis.
 *
 * @param {string} cwd - The directory to check for the lockfile
 *
 * @returns {Promise<boolean>} A promise that resolves to true if the lockfile exists, false otherwise
 */
export async function hasLockfile(cwd: string = process.cwd()): Promise<boolean> {
  return fs.exists(path.join(cwd, "emojis.lock"));
}
