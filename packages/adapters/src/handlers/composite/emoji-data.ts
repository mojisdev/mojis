import { type } from "arktype";
import { createCompositeHandlerBuilder } from "../../builders/composite-builder/builder";

import * as handlers from "../source";

const builder = createCompositeHandlerBuilder({
  outputSchema: type({
    version: "string",
  }),
});

export const compositeHandler = builder
  .adapterSources([
    handlers.metadataHandler,
    handlers.sequencesHandler,
    handlers.unicodeNamesHandler,
  ])
  .transform((ctx, sources) => {
    console.error("ctx", ctx);
    console.error("sources", sources);

    return {
      value: "test",
    };
  })
  .transform((ctx, sources) => {
    console.error("ctx", ctx);
    console.error("sources", sources);

    return {
      value2: "test2",
    };
  })
  .transform((_, sources) => {
    //           ^?
    return {
      hello: "world",
      version: sources.value2,
    };
  })
  .output((_, transformed) => {
    //           ^?
    console.error("transformed", transformed);
    return transformed;
  });
