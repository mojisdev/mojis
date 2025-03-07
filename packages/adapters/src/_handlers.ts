import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
} from "@mojis/internal-utils";
import type { AdapterHandler, AdapterHandlerType } from "./types";
import { modern_metadata_handler, modern_sequence_handler } from "./handlers/modern";

export const metadata_handlers = [
  modern_metadata_handler,
] satisfies AdapterHandler<"metadata", any, any, any, any, {
  groups: EmojiGroup[];
  emojis: Record<string, Record<string, EmojiMetadata>>;
}>[];

export const sequence_handlers = [
  modern_sequence_handler,
] satisfies AdapterHandler<"sequence", any, any, any, any, EmojiSequence[]>[];

export const all_handlers = {
  metadata: metadata_handlers,
  sequence: sequence_handlers,
};
