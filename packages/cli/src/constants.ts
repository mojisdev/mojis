import type { SourceAdapterType } from "@mojis/adapters";

export const DEFAULT_GENERATORS = [
  "metadata",
  "sequences",
  "variations",
  "unicode-names",
  // "shortcodes",
  // "emojis",
] satisfies SourceAdapterType[];

export const DEFAULT_SHORTCODE_PROVIDERS = [
  "github",
];
