import type { SourceAdapter } from "../src/builders/source-builder/types";
import type { AdapterContext } from "../src/global-types";
import { bench } from "@ark/attest";
import { type } from "arktype";
import { createSourceAdapter } from "../src/builders/source-builder/builder";
import { handler as metadataHandler } from "../src/handlers/source/metadata";
import { handler as sequencesHandler } from "../src/handlers/source/sequences";
import { handler as unicodeNamesHandler } from "../src/handlers/source/unicode-names";
import { handler as variationsHandler } from "../src/handlers/source/variations";

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

bench("source adapter with transforms", () => {
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
  }).withTransform(
    () => true,
    (builder) => {
      return builder
        .urls(() => "v14")
        .parser("generic")
        .transform((_, data) => data)
        .output((_, data) => {
          return {
            hello: data.lines.join(","),
            world: `${data.totalLines}`,
          };
        });
    },
  ).build();
}).types([21691, "instantiations"]);

bench("source adapter with multiple transforms", () => {
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
  })
    .withTransform(
      () => true,
      (builder) => {
        return builder
          .urls(() => "v14")
          .parser("generic")
          .transform((_, data) => data)
          .output((_, data) => {
            return {
              hello: data.lines.join(","),
              world: `${data.totalLines}`,
            };
          });
      },
    )
    .withTransform(
      () => true,
      (builder) => {
        return builder
          .urls(() => "v14")
          .parser("generic")
          .transform((_, data) => data)
          .output((_, data) => {
            return {
              hello: data.lines.join(","),
              world: `${data.totalLines}`,
            };
          });
      },
    )
    .withTransform(
      () => true,
      (builder) => {
        return builder
          .urls(() => "v14")
          .parser("generic")
          .transform((_, data) => data)
          .output((_, data) => {
            return {
              hello: data.lines.join(","),
              world: `${data.totalLines}`,
            };
          });
      },
    )
    .build();
}).types([25705, "instantiations"]);

bench("metadata handler", () => {
  // eslint-disable-next-line ts/no-unused-expressions
  metadataHandler;
}).types([43929, "instantiations"]);

bench("sequencesHandler", () => {
  // eslint-disable-next-line ts/no-unused-expressions
  sequencesHandler;
}).types([31853, "instantiations"]);

bench("unicodeNamesHandler", () => {
  // eslint-disable-next-line ts/no-unused-expressions
  unicodeNamesHandler;
}).types([25083, "instantiations"]);

bench("variationsHandler", () => {
  // eslint-disable-next-line ts/no-unused-expressions
  variationsHandler;
}).types([27934, "instantiations"]);
