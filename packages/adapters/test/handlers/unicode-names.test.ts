import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { afterEach, describe, expect, it } from "vitest";
import { handler } from "../../src/handlers/unicode-names";
import { cleanupAdapterTest, setupAdapterTest } from "../test-utils";

describe("unicode-names adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  afterEach(() => {
    cleanupAdapterTest();
  });

  it("should handle known version mappings", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("1F600;GRINNING FACE")],
    ]);

    const result = await runAdapterHandler("unicode-names", mockContext);
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
    });
  });

  it("should handle legacy version mappings", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/1.1-Update/UnicodeData-1.1.5.txt", () => HttpResponse.text("1F600;GRINNING FACE")],
    ]);

    const result = await runAdapterHandler("unicode-names", { ...mockContext, emoji_version: "1.0" });
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
    });
  });

  it("should handle multiple entries", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text(
        "1F600;GRINNING FACE\n"
        + "1F601;GRINNING FACE WITH SMILING EYES\n"
        + "1F602;FACE WITH TEARS OF JOY",
      )],
    ]);

    const result = await runAdapterHandler("unicode-names", mockContext);
    expect(result).toEqual({
      "1F600": "GRINNING FACE",
      "1F601": "GRINNING FACE WITH SMILING EYES",
      "1F602": "FACE WITH TEARS OF JOY",
    });
  });

  it("should throw error for invalid line format", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("1F600")],
    ]);

    await expect(runAdapterHandler("unicode-names", mockContext))
      .rejects
      .toThrow("Invalid line");
  });

  it("should handle empty response", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => HttpResponse.text("")],
    ]);

    const result = await runAdapterHandler("unicode-names", mockContext);
    expect(result).toEqual({});
  });

  it("should handle network errors", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/${mockContext.emoji_version}.0/ucd/UnicodeData.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runAdapterHandler("unicode-names", mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest({ cache });

    addHandlerToMock("unicode-names", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/15.0.0/ucd/UnicodeData.txt", () => {
        fetchCount++;
        return HttpResponse.text("1F600;GRINNING FACE");
      }],
    ]);

    // first request
    await runAdapterHandler("unicode-names", mockContext);

    // second request with force=true should bypass cache
    await runAdapterHandler("unicode-names", { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });
});
