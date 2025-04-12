import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { describe, expect, it } from "vitest";
import { unicodeNamesHandler } from "../../../src/handlers/adapter";
import { setupAdapterTest } from "../../__utils";

describe("unicode-names adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  it("should handle known version mappings", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("1F600;GRINNING FACE")],
    ]);

    const result = await runSourceAdapter(unicodeNamesHandler, mockContext);
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
    });
  });

  it("should handle legacy version mappings", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/1.1-Update/UnicodeData-1.1.5.txt", () => HttpResponse.text("1F600;GRINNING FACE")],
    ]);

    const result = await runSourceAdapter(unicodeNamesHandler, { ...mockContext, emoji_version: "1.0" });
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
    });
  });

  it("should handle multiple entries", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text(
        "1F600;GRINNING FACE\n"
        + "1F601;GRINNING FACE WITH SMILING EYES\n"
        + "1F602;FACE WITH TEARS OF JOY",
      )],
    ]);

    const result = await runSourceAdapter(unicodeNamesHandler, mockContext);
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
      "1F601": "GRINNING FACE WITH SMILING EYES",
      "1F602": "FACE WITH TEARS OF JOY",
    });
  });

  it("should throw error for invalid line format", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("1F600")],
    ]);

    await expect(runSourceAdapter(unicodeNamesHandler, mockContext))
      .rejects
      .toThrow("Invalid line");
  });

  it("should handle empty response", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("")],
    ]);

    const result = await runSourceAdapter(unicodeNamesHandler, mockContext);
    expect(result).toEqual({});
  });

  it("should handle network errors", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/${mockContext.emoji_version}.0/ucd/UnicodeData.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runSourceAdapter(unicodeNamesHandler, mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runSourceAdapter } = await setupAdapterTest({ cache });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => {
        fetchCount++;
        return HttpResponse.text("1F600;GRINNING FACE");
      }],
    ]);

    // first request
    await runSourceAdapter(unicodeNamesHandler, mockContext);

    // second request with force=true should bypass cache
    await runSourceAdapter(unicodeNamesHandler, { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });
});
