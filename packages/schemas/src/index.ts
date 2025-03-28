import { z } from "zod";

export const SHORTCODE_PROVIDER_SCHEMA = z.union([
  z.literal("github"),
  z.literal("slack"),
]);

export type ShortcodeProvider = z.infer<typeof SHORTCODE_PROVIDER_SCHEMA>;

export const SHORTCODE_PROVIDERS_SCHEMA = z.array(SHORTCODE_PROVIDER_SCHEMA);

export const GENERATOR_SCHEMA = z.union([
  z.literal("metadata"),
  z.literal("sequences"),
  z.literal("emojis"),
  z.literal("variations"),
  z.literal("shortcodes"),
  z.literal("unicode-names"),
]);

export type Generator = z.infer<typeof GENERATOR_SCHEMA>;
