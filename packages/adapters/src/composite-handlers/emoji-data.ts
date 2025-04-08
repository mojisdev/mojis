import { type } from "arktype";
import { createCompositeHandlerBuilder } from "../composite-builder/builder";

import * as handlers from "../handlers/index";

const builder = createCompositeHandlerBuilder({
  outputSchema: type({
  }),
});

export const handler = builder
  .sources([
    handlers.metadataHandler,
    handlers.sequencesHandler,
    handlers.unicodeNamesHandler,
  ])
  .build();
