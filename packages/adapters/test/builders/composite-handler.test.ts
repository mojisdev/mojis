import type { Type } from "arktype";
import type { CompositeHandler } from "../../src/builders/composite-builder/types";
import type { AdapterContext, EmptyObject } from "../../src/global-types";
import { EMOJI_GROUPS_SCHEMA, GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA } from "@mojis/schemas/emojis";
import { type } from "arktype";
import { describe, expect, expectTypeOf, it } from "vitest";
import { defineCompositeHandler, defineCompositeTransformer } from "../../src/builders/composite-builder/define";
import * as sourceAdapters from "../../src/handlers/source";
import { DUMMY_ADAPTER_CONTEXT } from "../__utils";

describe("composite handler builder", () => {
  it("creates with empty sources", () => {
    const composite = defineCompositeHandler({
      outputSchema: type({
        version: "string",
      }),
      transforms: [],
    });

    expect(composite).toBeDefined();
    expectTypeOf(composite).toEqualTypeOf<CompositeHandler<Type<{
      version: string;
    }, EmptyObject>, [], EmptyObject, []>>();

    expect(composite.transforms).toHaveLength(0);
  });

  it("creates with sources", () => {
    const composite = defineCompositeHandler({
      outputSchema: type({
        version: "string",
      }),
      sources: {
        hello: () => "world",
        version: (ctx) => ctx.emoji_version,
      },
      transforms: [],
    });

    expect(composite).toBeDefined();
    expect(Object.keys(composite.sources!)).toHaveLength(2);
    expectTypeOf(composite.sources).toEqualTypeOf<{
      readonly hello: () => string;
      readonly version: (ctx: AdapterContext) => string;
    } | undefined>();

    expect(composite.sources).toStrictEqual({
      hello: expect.any(Function),
      version: expect.any(Function),
    });
    expect(composite.sources?.hello()).toBe("world");
    expect(composite.sources?.version(DUMMY_ADAPTER_CONTEXT)).toBe("15.0");
  });

  it("create with adapter source", () => {
    const composite = defineCompositeHandler({
      outputSchema: type({
        version: "string",
      }),
      adapterSources: [
        sourceAdapters.metadataHandler,
      ],
      transforms: [],
    });

    expect(composite).toBeDefined();
    expect(composite.adapterSources).toHaveLength(1);

    expect(composite.adapterSources).toStrictEqual(expect.arrayContaining([
      expect.objectContaining({
        adapterType: "metadata",
        handlers: expect.arrayContaining([
          expect.any(Array),
        ]),
        transformerOutputSchema: type({
          groups: EMOJI_GROUPS_SCHEMA,
          emojis: GROUPED_BY_GROUP_EMOJI_METADATA_SCHEMA,
        }),
      }),
    ]));
  });

  it("creates with transforms", () => {
    const composite = defineCompositeHandler({
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

    expect(composite).toBeDefined();
    expect(composite.transforms).toHaveLength(2);

    expect(composite.transforms[0]).toEqual(expect.any(Function));
  });
});
