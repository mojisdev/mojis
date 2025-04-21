import { assertValidVersion } from "./asserts";
import { API_BASE_URL } from "./constants";

export interface HasEmojiDataOptions {
  /**
   * The version of the emoji data to check.
   */
  version: string;

  /**
   * The branch to check for emoji data.
   * @default "main"
   */
  branch?: string;

  /**
   * The base URL to use for the request.
   * @default "https://api.mojis.dev"
   */
  baseUrl?: string;
}

/**
 * Checks if emoji data exists for a given version.
 *
 * @param {HasEmojiDataOptions} options - Options for checking emoji data
 * @param options.version - The emoji version to check
 * @param options.branch - Optional branch parameter to specify a GitHub branch
 * @param options.baseUrl - Optional base URL for the API, defaults to API_BASE_URL
 *
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the emoji data exists
 *
 * @throws Will not throw errors as they are caught internally, instead returns false
 *
 * @example
 * ```ts
 * const exists = await hasEmojiData({ version: "15.0" });
 *
 * // Check with custom branch and URL
 * const exists = await hasEmojiData({
 *   version: "15.0",
 *   branch: "main",
 *   baseUrl: "https://custom-api.example.com"
 * });
 * ```
 */
export async function hasEmojiData(options: HasEmojiDataOptions): Promise<boolean> {
  try {
    const {
      version,
      branch,
      baseUrl = API_BASE_URL,
    } = options;

    assertValidVersion(version);

    const url = new URL(
      `/api/v1/emoji-data/${version}`,
      baseUrl,
    );

    if (branch != null) {
      url.searchParams.set("branch", branch);
    }

    const res = await fetch(url);

    if (!res.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
