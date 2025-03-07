import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiVariation,
} from "@mojis/internal-utils";
import type { ParseResult } from "@mojis/parsers";
import type { AdapterContext, AdapterHandler, MetadataAdapterHandler } from "./types";
import { modernMetadataHandler } from "./handlers/modern/metadata";
import { modernSequenceHandler } from "./handlers/modern/sequence";
import { modernVariationHandler } from "./handlers/modern/variation";
import { preAlignmentMetadataHandler } from "./handlers/pre-alignment/metadata";

export const metadata_handlers = [
  modernMetadataHandler,
  preAlignmentMetadataHandler,
] satisfies MetadataAdapterHandler[];

export const sequence_handlers = [
  modernSequenceHandler,
] satisfies AdapterHandler<"sequence", any, any, any, EmojiSequence[]>[];

export const variation_handlers = [
  modernVariationHandler,
] satisfies AdapterHandler<"variation", any, any, any, EmojiVariation[]>[];

export const all_handlers = {
  metadata: metadata_handlers,
  sequence: sequence_handlers,
  variation: variation_handlers,
};
