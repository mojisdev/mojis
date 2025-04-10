import type { AdapterContext } from "packages/adapters/src/global-types";
import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { createCompositeHandlerBuilder } from "../../src/builders/composite-builder/builder";
import { createTestAdapterHandler } from "../__utils";

describe("composite handler builder", () => {
  it("creates with type", () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    });
    const handler = builder.build();
    expect(handler.outputSchema).toBeDefined();
    expect(handler.outputSchema).toEqual(
      type({
        version: "string",
      }),
    );
  });

  it("creates with empty sources", () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    });
    const handler = builder.build();
    expect(handler.sources).toHaveLength(0);
    expect(handler.adapterSources).toHaveLength(0);
  });

  it("adds version source", () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    });

    const handler = builder
      .sources({
        hello: () => "world",
        version: (ctx) => ctx.emoji_version,
      })
      .build();

    expect(handler.sources).toStrictEqual({
      hello: expect.any(Function),
      version: expect.any(Function),
    });
    expect(handler.sources.hello()).toBe("world");
  });

  it("adds adapter source", () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    });

    const handler = builder
      .adapterSources([
        createTestAdapterHandler("hello", [
          [() => true, {
            globalContext: undefined,
            fetchOptions: undefined,
            cacheOptions: undefined,
            parser: undefined,
            parserOptions: undefined,
            urls(ctx: AdapterContext) {
              throw new Error("Function not implemented.");
            },
            transform(ctx: any, data: any) {
              throw new Error("Function not implemented.");
            },
            aggregate(ctx: any, data: any[]) {
              throw new Error("Function not implemented.");
            },
            output: "string",
            outputSchema: undefined,
          }],

        ]),
      ])
      .build();

    expect(handler.adapterSources).toStrictEqual(expect.arrayContaining([
      expect.objectContaining({
        adapterType: "hello",
        handlers: expect.arrayContaining([
          expect.any(Array),
        ]),
        outputSchema: undefined,
      }),
    ]));
  });
});
