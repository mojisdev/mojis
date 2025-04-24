import { bench } from "@ark/attest";
import { type } from "arktype";
import { createSourceAdapter } from "../../src/builders/source-builder/builder";

bench("source adapter builder", () => {
  createSourceAdapter({
    type: "metadata",
    transformerOutputSchema: type({
      hello: "string",
      world: "string",
    }),
    fallback: {
      hello: "hello",
      world: "world",
    },
    persistence: {
      schemas: {},
    },
  });
}).types([19921, "instantiations"]);
