import { baseMetadataHandler, notSupportedMetadataHandler } from "./handlers/metadata";
import { modernSequenceHandler } from "./handlers/modern/sequence";
import { baseVariationHandler, notSupportedVariationHandler } from "./handlers/variation";

export const METADATA_HANDLERS = [
  baseMetadataHandler,
  notSupportedMetadataHandler,
];

export const SEQUENCE_HANDLERS = [
  modernSequenceHandler,
];

export const VARIATION_HANDLERS = [
  baseVariationHandler,
  notSupportedVariationHandler,
];

export const ALL_HANDLERS = {
  metadata: METADATA_HANDLERS,
  sequence: SEQUENCE_HANDLERS,
  variation: VARIATION_HANDLERS,
};
