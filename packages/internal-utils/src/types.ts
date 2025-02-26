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

export type EmojiGroupWithMetadata = Omit<EmojiGroup, "subgroups"> & {
  subgroups: EmojiSubgroupWithMetadata[];
};

export interface EmojiSubgroupWithMetadata {
  name: string;
  emojis: EmojiMetadata[];
}

export interface EmojiSequence {
  property: string;
  hex: string;
  description: string;
  gender: string | null;
}
