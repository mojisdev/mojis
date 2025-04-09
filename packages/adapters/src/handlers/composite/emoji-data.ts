import { type } from "arktype";
import { createCompositeHandlerBuilder } from "../../builders/composite-builder/builder";

import * as handlers from "../adapter";

const builder = createCompositeHandlerBuilder({
  outputSchema: type({}),
});

export const compositeHandler = builder
  .adapterSources([
    handlers.metadataHandler,
    handlers.sequencesHandler,
    handlers.unicodeNamesHandler,
  ])
  .sources({
    test1: "test1",
    test2: "test2",
    test3: "test3",
    test4: () => "test4",
    test5: () => "test5",
    test6: () => "test6",
    test7: async () => "test7",
    test8: async () => "test8",
    test9: async () => "test9",
  })
  .transform((ctx, sources) => {
    console.error("ctx", ctx);
    console.error("sources", sources);

    return {
      test: "test",
      sources,
    };
  })
  .build();
