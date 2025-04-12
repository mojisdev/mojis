import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { variations } from "@mojis/loomicode";
import { describe, expect, it } from "vitest";
import { variationsHandler } from "../../../src/handlers/source";
import { setupAdapterTest } from "../../__utils";

describe("variations adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: true,
  };

  it("should handle basic emoji variations", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockVariations = variations.commonSymbols({
      separator: ";",
      commentPrefix: "#",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    const result = await runSourceAdapter(variationsHandler, mockContext);
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
    const { runSourceAdapter } = await setupAdapterTest();

    const mockVariations = `
FE0E ; text style     # VS-15
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/12.1/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    const result = await runSourceAdapter(variationsHandler, {
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
    const { runSourceAdapter } = await setupAdapterTest();

    const result = await runSourceAdapter(variationsHandler, {
      ...mockContext,
      emoji_version: "1.0",
      unicode_version: "1.0",
    });

    expect(result).toEqual([]);
  });

  it("should handle empty response", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text("")],
    ]);

    const result = await runSourceAdapter(variationsHandler, mockContext);
    expect(result).toEqual([]);
  });

  it("should handle network errors", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runSourceAdapter(variationsHandler, mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runSourceAdapter } = await setupAdapterTest({ cache });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => {
        fetchCount++;
        return HttpResponse.text("FE0E ; text style     # VS-15");
      }],
    ]);

    // first request
    await runSourceAdapter(variationsHandler, mockContext);

    // second request with force=true should bypass cache
    await runSourceAdapter(variationsHandler, { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });

  it("should handle invalid line format", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockVariations = `
invalid-line
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    await expect(runSourceAdapter(variationsHandler, mockContext))
      .rejects
      .toThrow("invalid line");
  });

  it("should handle invalid style", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockVariations = variations.invalid({
      separator: ";",
      commentPrefix: "#",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/emoji/emoji-variation-sequences.txt", () => HttpResponse.text(mockVariations)],
    ]);

    await expect(runSourceAdapter(variationsHandler, mockContext))
      .rejects
      .toThrow("invalid style");
  });
});
