import z from "zod";

// TODO: find a better name for this schema
export const EMOJI_VERSION_SCHEMA = z.object({
  emoji_version: z.string(),
  unicode_version: z.string(),
  draft: z.boolean(),
  fallback: z.string().optional().nullable(),
});

export const SHORTCODE_PROVIDER_SCHEMA = z.union([
  z.literal("github"),
  z.literal("slack"),
]);

export const SHORTCODE_PROVIDERS_SCHEMA = z.array(SHORTCODE_PROVIDER_SCHEMA);

export const GENERATOR_SCHEMA = z.union([
  z.literal("metadata"),
  z.literal("sequences"),
  z.literal("emojis"),
  z.literal("variations"),
  z.literal("shortcodes"),
  z.literal("unicode-names"),
]);
