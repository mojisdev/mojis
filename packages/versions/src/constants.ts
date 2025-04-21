export const OFFICIAL_SUPPORTED_VERSIONS = [
  "1.0",
  "2.0",
  "3.0",
  "4.0",
  "5.0",
  "11.0",
  "12.0",
  "12.1",
  "13.0",
  "13.1",
  "14.0",
  "15.0",
  "15.1",
  "16.0",
];

/**
 * These versions don't exist in the Unicode Consortium's emoji versioning scheme.
 * This is because they aligned the emoji version with the Unicode version starting from v11.
 *
 * So actually, the emoji version v11.0 is v6.0
 */
export const NON_EXISTING_VERSIONS = ["6.x", "7.x", "8.x", "9.x", "10.x"];

export const API_BASE_URL = "https://api.mojis.dev";
export const PREVIEW_API_BASE_URL = "https://api.preview.mojis.dev";

export const MAPPED_EMOJI_VERSIONS: Record<string, string> = {
  "0.7": "7.0",
  "1.0": "8.0",
  "2.0": "8.0",
  "3.0": "9.0",
  "4.0": "9.0",
  "5.0": "10.0",

  // There doesn't seem to be a Unicode 13.1, so we'll map it to 13.0
  "13.1": "13.0",
};
