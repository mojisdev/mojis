import { type } from "arktype";

export const EMOJI_SPEC_RECORD_SCHEMA = type({
  "emoji_version": "string",
  "unicode_version": "string",
  "draft": "boolean",
  "fallback?": "string | null",
});

export type EmojiSpecRecord = typeof EMOJI_SPEC_RECORD_SCHEMA.infer;

export const EMOJI_GROUP_SCHEMA = type({
  name: "string",
  slug: "string",
  subgroups: "string[]",
});

export type EmojiGroup = typeof EMOJI_GROUP_SCHEMA.infer;

export const EMOJI_GROUPS_SCHEMA = EMOJI_GROUP_SCHEMA.array();

export const EMOJI_METADATA_SCHEMA = type({
  group: "string",
  subgroup: "string",
  qualifier: "string",
  unicodeVersion: "string | null",
  emojiVersion: "string | null",
  description: "string",
  emoji: "string | null",
  hexcodes: "string[]",
});

export type EmojiMetadata = typeof EMOJI_METADATA_SCHEMA.infer;

export const GROUPED_BY_HEXCODE_EMOJI_METADATA_SCHEMA = type({
  "[string]": EMOJI_METADATA_SCHEMA,
});

export const GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA = type({
  "[string]": GROUPED_BY_HEXCODE_EMOJI_METADATA_SCHEMA,
});

export type GroupedEmojiMetadata = typeof GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA.infer;

export const EMOJI_SEQUENCE_SCHEMA = type({
  property: "string",
  hex: "string",
  description: "string | null",
  gender: "string | null",
});

export type EmojiSequence = typeof EMOJI_SEQUENCE_SCHEMA.infer;

export const EMOJI_VARIATION_SCHEMA = type({
  text: "string | null",
  emoji: "string | null",
  property: "string[] | null",
});

export type EmojiVariation = typeof EMOJI_VARIATION_SCHEMA.infer;
