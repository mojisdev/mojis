import type { z } from "zod";
import type { SHORTCODE_PROVIDER_SCHEMA } from "./schemas";

export interface EmojiGroup {
  name: string;
  slug: string;
  subgroups: string[];
}

export interface EmojiMetadata {
  group: string;
  subgroup: string;
  qualifier: string;
  unicodeVersion: string | null;
  emojiVersion: string | null;
  description: string;
  emoji: string | null;
  hexcodes: string[];
}

export interface EmojiSequence {
  property: string;
  hex: string;
  description: string;
  gender: string | null;
}

export type ShortcodeProvider = z.infer<typeof SHORTCODE_PROVIDER_SCHEMA>;
