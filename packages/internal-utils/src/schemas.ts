import z from "zod";

export const EMOJI_SPEC_RECORD_SCHEMA = z.object({
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

export const EMOJI_GROUP_SCHEMA = z.object({
  name: z.string(),
  slug: z.string(),
  subgroups: z.array(z.string()),
});

export const EMOJI_GROUPS_SCHEMA = z.array(EMOJI_GROUP_SCHEMA);

export const EMOJI_METADATA_SCHEMA = z.object({
  group: z.string(),
  subgroup: z.string(),
  qualifier: z.string(),
  unicodeVersion: z.string().nullable(),
  emojiVersion: z.string().nullable(),
  description: z.string(),
  emoji: z.string().nullable(),
  hexcodes: z.array(z.string()),
});
