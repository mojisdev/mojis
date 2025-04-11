import { EMOJI_GROUPS_SCHEMA, GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA } from "@mojis/schemas/emojis";
import { type } from "arktype";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createCompositeHandlerBuilder } from "../../src/builders/composite-builder/builder";
import { metadataHandler } from "../../src/handlers/adapter";

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
        metadataHandler,
      ])
      .build();

    expect(handler.adapterSources).toStrictEqual(expect.arrayContaining([
      expect.objectContaining({
        adapterType: "metadata",
        handlers: expect.arrayContaining([
          expect.any(Array),
        ]),
        outputSchema: type({
          groups: EMOJI_GROUPS_SCHEMA,
          emojis: GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA,
        }),
      }),
    ]));
  });

  it("adds transform", async () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        hello: "string",
      }),
    });

    const handler = builder
      .sources({
        hello: () => "world",
        world: (ctx) => ctx.emoji_version,
      })
      .transform((ctx, data) => {
        //              ^?

        return {
          hello: data.hello,
        };
      })
      .build();

    console.error({
      sources: handler.sources,
      adapterSources: handler.adapterSources,
      transforms: handler.transforms,
    });

    expect(handler.transforms).toBeDefined();
    expect(handler.transforms).toHaveLength(1);
    expect(handler.transforms[0]).toEqual(expect.any(Function));

    const ctx = {
      emoji_version: "15.0",
      unicode_version: "15.0",
      force: true,
    };

    const sources = Object.entries(handler.sources).reduce((acc, [key, value]) => {
      acc[key] = value(ctx);
      return acc;
    }, {} as {
      hello: string;
      world: string;
      [key: string]: string;
    });

    const transformed = await handler.transforms[0](ctx, sources);
    //     ^?

    expectTypeOf(transformed).not.toBeAny();
    expect(transformed).toEqual({
      hello: "world",
    });
  });
});
