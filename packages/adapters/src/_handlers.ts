import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
} from "@mojis/internal-utils";
import type { AdapterHandler } from "./types";
import { modernMetadataHandler } from "./handlers/modern/metadata";
import { modernSequenceHandler } from "./handlers/modern/sequence";
import { preAlignmentMetadataHandler } from "./handlers/pre-alignment/metadata";

export const metadata_handlers = [
  modernMetadataHandler,
  preAlignmentMetadataHandler,
] satisfies AdapterHandler<"metadata", any, any, any, any, {
  groups: EmojiGroup[];
  emojis: Record<string, Record<string, EmojiMetadata>>;
}>[];

export const sequence_handlers = [
  modernSequenceHandler,
] satisfies AdapterHandler<"sequence", any, any, any, any, EmojiSequence[]>[];

export const all_handlers = {
  metadata: metadata_handlers,
  sequence: sequence_handlers,
};
