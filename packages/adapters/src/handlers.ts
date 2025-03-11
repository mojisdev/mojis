import { baseVariationHandler } from "./handlers/base/variation";
import { baseMetadataHandler, notSupportedMetadataHandler } from "./handlers/metadata";
import { modernSequenceHandler } from "./handlers/modern/sequence";

export const METADATA_HANDLERS = [
  baseMetadataHandler,
  notSupportedMetadataHandler,
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
