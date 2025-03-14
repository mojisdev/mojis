import type { AdapterHandlerType } from "@mojis/adapters";

export const DEFAULT_GENERATORS = [
  "metadata",
  "sequences",
  "variations",
  "unicode-names",
  // "shortcodes",
  // "emojis",
] satisfies AdapterHandlerType[];

export const DEFAULT_SHORTCODE_PROVIDERS = [
  "github",
];
