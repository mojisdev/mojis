import path from "node:path";
import fs from "fs-extra";

interface WriteOptions {
  force?: boolean;
  encoding?: BufferEncoding;
}

/**
 * Ensures the directory exists and writes data to the given file.
 * Throws an error if the file already exists and force is not true.
 *
 * @param {string} filePath - The full path to the file.
 * @param {string} data - The file contents.
 * @param {WriteOptions} options - Options including force overwrite and encoding.
 */
export async function writeFileSafe(filePath: string, data: string, options: WriteOptions = {}): Promise<void> {
  const { force = false, encoding } = options;
  const dir = path.dirname(filePath);
  await fs.ensureDir(dir);

  if (await fs.pathExists(filePath) && !force) {
    throw new Error(`File already exists: ${filePath}`);
  }

  await fs.writeFile(filePath, data, encoding);
}

/**
 * Writes a JSON object to the specified file.
 *
 * @param {string} filePath - The full path to the JSON file.
 * @param {Record<string, unknown>} json - The object to be stringified and written.
 * @param {WriteOptions} options - Write options including force overwrite.
 */
export async function writeJsonFile(filePath: string, json: Record<string, unknown>, options: WriteOptions = {}): Promise<void> {
  const data = JSON.stringify(json, null, 2);
  return writeFileSafe(filePath, data, { ...options, encoding: "utf-8" });
}
