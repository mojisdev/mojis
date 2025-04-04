import { z } from "zod";
import { createCompositeHandlerBuilder } from "../composite-builder/builder";

const builder = createCompositeHandlerBuilder({
  outputSchema: z.any(),
});

export const handler = builder
  .sources([
    "metadata",
    "sequences",
    "unicode-names",
  ])
  .build();
