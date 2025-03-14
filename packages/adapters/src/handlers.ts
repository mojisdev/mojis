import { baseMetadataHandler, notSupportedMetadataHandler } from "./handlers/metadata";
import { baseSequenceHandler, notSupportedSequenceHandler } from "./handlers/sequence";
import { baseVariationHandler, notSupportedVariationHandler } from "./handlers/variation";

export const METADATA_HANDLERS = [
  baseMetadataHandler,
  notSupportedMetadataHandler,
];

export const SEQUENCE_HANDLERS = [
  baseSequenceHandler,
  notSupportedSequenceHandler,
];

export const VARIATION_HANDLERS = [
  baseVariationHandler,
  notSupportedVariationHandler,
];

export const ALL_HANDLERS = {
  metadata: METADATA_HANDLERS,
  sequences: SEQUENCE_HANDLERS,
  variations: VARIATION_HANDLERS,
};
