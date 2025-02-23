import z from "zod";

// TODO: find a better name for this schema
export const EMOJI_VERSION_SCHEMA = z.object({
  emoji_version: z.string(),
  unicode_version: z.string(),
  draft: z.boolean(),
});
