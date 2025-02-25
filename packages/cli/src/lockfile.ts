import path from "node:path";
import process from "node:process";
import { EMOJI_VERSION_SCHEMA } from "@mojis/internal-utils/schemas";
import fs from "fs-extra";
import z from "zod";

const LOCKFILE_SCHEMA = z.object({
  updated_at: z.number().optional().default(new Date().getTime()),
  latest_version: z.string().nullable().optional(),
  versions: z.array(EMOJI_VERSION_SCHEMA),
});

export type EmojiLockfile = z.infer<typeof LOCKFILE_SCHEMA>;

const DEFAULT_LOCKFILE = {
  updated_at: new Date().getTime(),
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

  return LOCKFILE_SCHEMA.parseAsync(json);
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
  const result = await LOCKFILE_SCHEMA.safeParseAsync(lockfile);

  if (!result.success) {
    // if lockfile is invalid, throw an error with the pretty-printed validation errors
    console.error(result.error);
    throw new Error("invalid lockfile");
  }

  await fs.writeJSON(path.join(cwd, "emojis.lock"), result.data, { spaces: 2 });
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
