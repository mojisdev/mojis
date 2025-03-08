import type {
  EmojiSequence,
  EmojiVariation,
} from "@mojis/internal-utils";
import type { AdapterHandler, MetadataAdapterHandler } from "./types";
import { modernMetadataHandler } from "./handlers/modern/metadata";
import { modernSequenceHandler } from "./handlers/modern/sequence";
import { modernVariationHandler } from "./handlers/modern/variation";
import { preAlignmentMetadataHandler } from "./handlers/pre-alignment/metadata";

export const METADATA_HANDLERS = [
  modernMetadataHandler,
  preAlignmentMetadataHandler,
];

export const SEQUENCE_HANDLERS = [
  modernSequenceHandler,
];

export const VARIATION_HANDLERS = [
  modernVariationHandler,
];

export const ALL_HANDLERS = {
  metadata: METADATA_HANDLERS,
  sequence: SEQUENCE_HANDLERS,
  variation: VARIATION_HANDLERS,
};
