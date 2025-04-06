import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { variations } from "@mojis/loomicode";
import { afterEach, describe, expect, it } from "vitest";
import { handler } from "../../src/handlers/variations";
import { cleanupAdapterTest, setupAdapterTest } from "../test-utils";

describe("variations adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: true,
  };

  afterEach(() => {
    cleanupAdapterTest();
  });

  it("should handle basic emoji variations", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockVariations = variations.commonSymbols({
      separator: ";",
      commentPrefix: "#",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    const result = await runAdapterHandler("variations", mockContext);
    expect(result).toEqual([
      {
        emoji: null,
        property: [
          "Emoji",
        ],
        text: "2764-FE0E",
      },
      {
        emoji: "2764-FE0F",
        property: [
          "Emoji",
        ],
        text: null,
      },
      {
        emoji: null,
        property: [
          "Emoji",
        ],
        text: "2B50-FE0E",
      },
      {
        emoji: "2B50-FE0F",
        property: [
          "Emoji",
        ],
        text: null,
      },
    ]);
  });

  it("should handle older emoji versions", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockVariations = `
FE0E ; text style     # VS-15
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/12.1/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    const result = await runAdapterHandler("variations", {
      ...mockContext,
      emoji_version: "12.1",
      unicode_version: "12.1",
    });

    expect(result).toEqual([
      {
        emoji: null,
        text: "FE0E",
        property: ["Emoji"],
      },
    ]);
  });

  it("should handle unsupported versions", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: handler.handlers[0][0],
      handler: handler.handlers[0][1],
      fallback: handler.fallback,
      outputSchema: handler.outputSchema,
    });

    const result = await runAdapterHandler("variations", {
      ...mockContext,
      emoji_version: "1.0",
      unicode_version: "1.0",
    });

    expect(result).toEqual([]);
  });

  it("should handle empty response", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text("")],
    ]);

    const result = await runAdapterHandler("variations", mockContext);
    expect(result).toEqual([]);
  });

  it("should handle network errors", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runAdapterHandler("variations", mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest({ cache });
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => {
        fetchCount++;
        return HttpResponse.text("FE0E ; text style     # VS-15");
      }],
    ]);

    // first request
    await runAdapterHandler("variations", mockContext);

    // second request with force=true should bypass cache
    await runAdapterHandler("variations", { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });

  it("should handle invalid line format", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockVariations = `
invalid-line
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    await expect(runAdapterHandler("variations", mockContext))
      .rejects
      .toThrow("invalid line");
  });

  it("should handle invalid style", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("variations", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockVariations = variations.invalid({
      separator: ";",
      commentPrefix: "#",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    await expect(runAdapterHandler("variations", mockContext))
      .rejects
      .toThrow("invalid style");
  });
});
