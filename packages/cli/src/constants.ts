import type { AdapterHandlerType } from "@mojis/adapters";

export const DEFAULT_GENERATORS = [
  "metadata",
  "sequences",
  "variations",
  // "shortcodes",
  // "emojis",
] satisfies AdapterHandlerType[];

export const DEFAULT_SHORTCODE_PROVIDERS = [
  "github",
];
