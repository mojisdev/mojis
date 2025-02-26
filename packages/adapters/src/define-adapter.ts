import type { MojiAdapter } from "./types";
import semver from "semver";

type MojiAdapterFunctionNames<T> = {
  [K in keyof T]: NonNullable<T[K]> extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Validates and defines a Moji adapter configuration.
 *
 * @param {MojiAdapter} adapter - The adapter configuration object to validate
 * @throws {Error} If adapter.name is missing
 * @throws {Error} If adapter.description is missing
 * @throws {Error} If adapter.range is missing
 * @throws {Error} If adapter.range is not a valid semver range
 * @throws {Error} If required functions are missing when adapter.extend is null
 * @returns {MojiAdapter} The validated adapter configuration
 *
 * @example
 * ```ts
 * const adapter = defineMojiAdapter({
 *   name: 'my-adapter',
 *   description: 'My adapter',
 *   range: '>=1.0.0',
 * });
 * ```
 */
export function defineMojiAdapter(adapter: MojiAdapter): MojiAdapter {
  // validate the adapter has name, description, range.
  if (!adapter.name) {
    throw new Error(`adapter.name is required`);
  }

  if (!adapter.description) {
    throw new Error(`adapter.description is required`);
  }

  if (!adapter.range) {
    throw new Error(`adapter.range is required`);
  }

  // verify the adapter.range is a valid semver range.
  if (semver.validRange(adapter.range) === null) {
    throw new Error(`adapter.range is not a valid semver range ${adapter.range}`);
  }

  if (adapter.extend == null) {
    // verify the adapter has the required functions.

    // TODO: figure out how we can make it throw type error if the adapter is missing a required function
    const REQUIRED_FUNCTIONS = [
      "sequences",
      "metadata",
      "shortcodes",
    ] satisfies NonNullable<MojiAdapterFunctionNames<MojiAdapter>>[];

    const missingFunctions = REQUIRED_FUNCTIONS.filter((fn) => adapter[fn] == null);
    if (missingFunctions.length > 0) {
      throw new Error(`adapter ${adapter.name} is missing required functions: ${missingFunctions.join(", ")}`);
    }
  }

  return adapter;
}
