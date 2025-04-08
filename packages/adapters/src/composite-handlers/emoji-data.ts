import { type } from "arktype";
import { createCompositeHandlerBuilder } from "../composite-builder/builder";

const builder = createCompositeHandlerBuilder({
  outputSchema: type({}),
});

export const handler = builder
  .sources([
    "metadata",
    "sequences",
    "unicode-names",
  ])
  .build();
