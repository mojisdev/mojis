import type { AnyCompositeHandler } from "../../src/builders/composite-builder/types";
import type { AdapterContext } from "../../src/global-types";
import { HttpResponse, mockFetch } from "#msw-utils";
import { type } from "arktype";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createCompositeHandlerBuilder } from "../../src/builders/composite-builder/builder";
import { createVersionedSourceTransformerBuilder } from "../../src/builders/version-builder/builder";
import { createFakeSourceAdapter, setupAdapterTest } from "../__utils";

describe("run composite handler", () => {
  const mockContext: AdapterContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  it("should throw error for invalid handler", async () => {
    const { runCompositeHandler } = await setupAdapterTest();

    await expect(() => runCompositeHandler({} as AnyCompositeHandler, mockContext),
    ).rejects.toThrow("provided handler is not valid");
  });

  it("should fetch sources", async () => {
    const { runCompositeHandler } = await setupAdapterTest();

    let fetchCount = 0;
    mockFetch([
      ["GET https://mojis.dev/test", () => {
        fetchCount++;
        return new HttpResponse("This is a test");
      }],
    ]);

    const handler = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    })
      .sources({
        test: async () => {
          const response = await fetch("https://mojis.dev/test");
          return response.text();
        },
      })
      .output(() => {
        return {
          version: "1.0",
        };
      });

    const result = await runCompositeHandler(handler, mockContext);

    expectTypeOf(result).toEqualTypeOf<{
      version: string;
    }>();

    expect(fetchCount).toBe(1);
    expect(result).toEqual({
      version: "1.0",
    });
  });

  it("should run adapter sources", async () => {
    const { runCompositeHandler } = await setupAdapterTest();

    let fetchCount = 0;
    mockFetch([
      ["GET https://mojis.dev/test", () => {
        fetchCount++;
        return new HttpResponse("17.0");
      }],
    ]);

    const mockHandler = createVersionedSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/test")
      .parser((_, data) => data)
      .transform((_, data) => data)
      .output((_, data) => ({ version: data }));

    const handler = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    })
      .adapterSources([
        createFakeSourceAdapter({
          adapterType: "metadata",
          handlers: [
            [() => true, mockHandler],
          ],
          outputSchema: type({
            version: "string",
          }),
        }),
      ])
      .output(() => {
        return {
          version: "1.0",
        };
      });

    const result = await runCompositeHandler(handler, mockContext);

    expectTypeOf(result).toEqualTypeOf<{
      version: string;
    }>();

    expect(fetchCount).toBe(1);
    expect(result).toEqual({
      version: "1.0",
    });
  });

  it("should run adapter sources & sources", async () => {
    const { runCompositeHandler } = await setupAdapterTest();

    let fetchCount = 0;
    mockFetch([
      ["GET https://mojis.dev/test", () => {
        fetchCount++;
        return new HttpResponse("17.0");
      }],
    ]);

    const mockHandler = createVersionedSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/test")
      .parser((_, data) => data)
      .transform((_, data) => data)
      .output((_, data) => ({ version: data }));

    const handler = createCompositeHandlerBuilder({
      outputSchema: type({
        version: "string",
      }),
    })
      .sources({
        test: async () => {
          const response = await fetch("https://mojis.dev/test");
          return response.text();
        },
      })
      .adapterSources([
        createFakeSourceAdapter({
          adapterType: "metadata",
          handlers: [
            [() => true, mockHandler],
          ],
          outputSchema: type({
            version: "string",
          }),
        }),
      ])
      .output(() => {
        return {
          version: "1.0",
        };
      });

    const result = await runCompositeHandler(handler, mockContext);

    expectTypeOf(result).toEqualTypeOf<{
      version: string;
    }>();

    expect(fetchCount).toBe(2);
    expect(result).toEqual({
      version: "1.0",
    });
  });

  describe("with transforms", () => {
    it("should run transforms", async () => {
      const { runCompositeHandler } = await setupAdapterTest();

      let fetchCount = 0;
      mockFetch([
        ["GET https://mojis.dev/random-name", () => {
          fetchCount++;
          return new HttpResponse("Bobby Charlton");
        }],
        ["GET https://mojis.dev/amount", () => {
          fetchCount++;
          return new HttpResponse("2");
        }],
      ]);

      const nameHandler = createVersionedSourceTransformerBuilder()
        .urls(() => "https://mojis.dev/random-name")
        .parser((_, data) => data)
        .transform((_, data) => data)
        .output((_, data) => ({ name: data }));

      const handler = createCompositeHandlerBuilder({
        outputSchema: type("string"),
      })
        .sources({
          amount: async () => {
            const response = await fetch("https://mojis.dev/amount");
            return Number.parseInt(await response.text(), 10);
          },
        })
        .adapterSources([
          createFakeSourceAdapter({
            adapterType: "metadata",
            handlers: [
              [() => true, nameHandler],
            ],
            outputSchema: type({
              name: "string",
            }),
          }),
        ])
        .transform((_, data) => {
          expect(data).toEqual({
            metadata: {
              name: "Bobby Charlton",
            },
            amount: 2,
          });

          let val = "";
          for (let i = 0; i < data.amount; i++) {
            val += `${data.metadata.name}\n`;
          }

          return val;
        })
        .output((_, data) => data);

      const result = await runCompositeHandler(handler, mockContext);

      expectTypeOf(result).toEqualTypeOf<string>();

      expect(fetchCount).toBe(2);
      expect(result).toEqual("Bobby Charlton\nBobby Charlton\n");
    });
  });
});
