import z from "zod";

export const EMOJI_VERSION_SCHEMA = z.object({
  emoji_version: z.string(),
  unicode_version: z.string(),
  draft: z.boolean(),
});
