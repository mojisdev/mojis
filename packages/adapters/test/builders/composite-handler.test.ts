import { EMOJI_GROUPS_SCHEMA, GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA } from "@mojis/schemas/emojis";
import { type } from "arktype";
import { metadataHandler } from "packages/adapters/src/handlers/adapter";
import { describe, expect, it } from "vitest";
import { createCompositeHandlerBuilder } from "../../src/builders/composite-builder/builder";

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

  it("adds transform", () => {
    const builder = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    });

    const handler = builder
      .sources({
        hello: () => "world",
        world: (ctx) => ctx.emoji_version,
      })
      .transform((ctx, data) => {
        console.error(data);
        return {
          ...data,
          ctx,
        };
      })
      .build();

    expect(handler.transform).toBeDefined();
    expect(handler.transform).toEqual(expect.any(Function));

    const ctx = {
      emoji_version: "15.0",
      unicode_version: "15.0",
      force: true,
    };

    expect(handler.transform(ctx, handler.sources)).toEqual({
      hello: "world",
      world: "15.0",
      ctx,
    });
  });
});
