import { baseMetadataHandler } from "./handlers/base/metadata";
import { baseVariationHandler } from "./handlers/base/variation";
import { modernSequenceHandler } from "./handlers/modern/sequence";
import { preAlignmentMetadataHandler } from "./handlers/pre-alignment/metadata";

export const METADATA_HANDLERS = [
  baseMetadataHandler,
  preAlignmentMetadataHandler,
];

export const SEQUENCE_HANDLERS = [
  modernSequenceHandler,
];

export const VARIATION_HANDLERS = [
  baseVariationHandler,
];

export const ALL_HANDLERS = {
  metadata: METADATA_HANDLERS,
  sequence: SEQUENCE_HANDLERS,
  variation: VARIATION_HANDLERS,
};
