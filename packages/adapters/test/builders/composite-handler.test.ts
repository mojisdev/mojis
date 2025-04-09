import type { AdapterContext } from "../../src/global-types";
import { type } from "arktype";
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
});
