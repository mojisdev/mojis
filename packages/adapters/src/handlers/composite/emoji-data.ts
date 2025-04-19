import { type } from "arktype";
import { createCompositeHandlerBuilder } from "../../builders/composite-builder/builder";

import { chain, defineCompositeHandler, defineCompositeTransformer } from "../../builders/composite-builder/define";
import * as handlers from "../source";

export const emojiCompositor = defineCompositeHandler({
  outputSchema: type({
    hello: "string",
  }),
  adapterSources: [
    handlers.metadataHandler,
    handlers.sequencesHandler,
    handlers.unicodeNamesHandler,
  ],
  transforms: chain([
    defineCompositeTransformer((ctx, sources) => {
      console.error("ctx", ctx);
      console.error("sources", sources);

      return {
        value: "test",
      };
    }),
    defineCompositeTransformer((ctx, sources) => {
      console.error("ctx", ctx);
      console.error("sources", sources);

      return {
        value2: "test2",
      };
    }),
    defineCompositeTransformer((_, sources) => {
      //           ^?
      return {
        hello: "world",
        version: sources.value2,
      };
    }),
  ]),
});
