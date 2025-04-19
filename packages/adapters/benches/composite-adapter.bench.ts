import { bench } from "@ark/attest";
import { type } from "arktype";
import { defineCompositeHandler, defineCompositeTransformer } from "../src/builders/composite-builder/define";
import { handler as metadataHandler } from "../src/handlers/source/metadata";

bench("source adapter builder", () => {
  defineCompositeHandler({
    outputSchema: type({
      version: "string",
    }),
    transforms: [
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
    ],
  });
}).types([19921, "instantiations"]);

bench("with sources", () => {
  defineCompositeHandler({
    outputSchema: type({
      version: "string",
    }),
    sources: {
      hello: () => "world",
      version: (ctx) => ctx.emoji_version,
    },
    transforms: [
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
    ],
  });
}).types([19921, "instantiations"]);

bench("with adapter sources", () => {
  defineCompositeHandler({
    outputSchema: type({
      version: "string",
    }),
    adapterSources: [
      metadataHandler,
    ],
    transforms: [
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
    ],
  });
}).types([19921, "instantiations"]);

bench("with both sources", () => {
  defineCompositeHandler({
    outputSchema: type({
      version: "string",
    }),
    adapterSources: [
      metadataHandler,
    ],
    sources: {
      hello: () => "world",
      version: (ctx) => ctx.emoji_version,
    },
    transforms: [
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
      defineCompositeTransformer((_, __) => {
        //                           ^?
        return {
          version: "v1.1.0",
        };
      }),
    ],
  });
}).types([19921, "instantiations"]);
