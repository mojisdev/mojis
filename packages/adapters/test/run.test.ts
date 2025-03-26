import type { AdapterContext, AdapterHandlerType, AnyAdapterHandler, AnyVersionHandler, PredicateFn } from "../src/types";
import { describe, expect, it, vi } from "vitest";
import { HttpResponse, mockFetch } from "../../../test/msw-utils/msw";
import { createVersionHandlerBuilder } from "../src/builder";
import * as handlers from "../src/handlers";
import { runAdapterHandler } from "../src/index";

// mock the handlers module
vi.mock("../src/handlers", () => ({
  metadata: {
    adapterType: "metadata",
    handlers: [],
  },
  sequences: {
    adapterType: "sequences",
    handlers: [],
  },
  unicodeNames: {
    adapterType: "unicode-names",
    handlers: [],
  },
  variations: {
    adapterType: "variations",
    handlers: [],
  },
}));

describe("runAdapterHandler", () => {
  const mockContext: AdapterContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  it("should throw error for invalid handler type", async () => {
    await expect(runAdapterHandler("invalid" as AdapterHandlerType, mockContext))
      .rejects
      .toThrow();
  });

  it("should return undefined when no handlers match version", async () => {
    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeUndefined();
  });

  it("should run matching version handler", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
    ]);

    const mockHandler = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    // mock the handlers module with a matching version handler
    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler],
      [(version: string) => version === "14.0", mockHandler2],
    );

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should run first matching version handler when multiple match", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
      ["GET https://mojis.dev/3", () => HttpResponse.text("mojis.dev/3")],
    ]);

    const mockHandler1 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler3 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/3")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler3" }))
      .output((_, data) => ({ processedBy: data.processed }));

    // mock the handlers module with multiple matching version handlers
    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler1],
      [(version: string) => version === "15.0", mockHandler2],
      [(version: string) => version === "14.0", mockHandler3],
    );

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle multiple URLs", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
      ["GET https://mojis.dev/3", () => HttpResponse.text("mojis.dev/3")],
    ]);

    const mockHandler = createVersionHandlerBuilder()
      .urls(() => ["https://mojis.dev/1", "https://mojis.dev/2"])
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/3")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler],
      [(version: string) => version === "14.0", mockHandler2],
    );

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle transformation and aggregation", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
    ]);

    const mockHandler = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, transformed: true }))
      .aggregate((_, data) => ({ ...data[0], aggregated: true }))
      .output((_, data) => data);

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, transformed: true }))
      .aggregate((_, data) => ({ ...data[0], aggregated: true }))
      .output((_, data) => data);

    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler],
      [(version: string) => version === "14.0", mockHandler2],
    );

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({
      transformed: true,
      aggregated: true,
      expect: expect.any(Object),
    });
  });

  it("should handle cache and fetch options", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
    ]);

    const mockHandler = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/1")
      .parser("generic")
      .cacheOptions({ ttl: 3600 })
      .fetchOptions({ method: "GET" })
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler],
      [(version: string) => version === "14.0", mockHandler2],
    );

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle force mode", async () => {
    mockFetch([
      ["GET https://mojis.dev/1", () => HttpResponse.text("mojis.dev/1")],
      ["GET https://mojis.dev/2", () => HttpResponse.text("mojis.dev/2")],
    ]);

    const mockHandler = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createVersionHandlerBuilder()
      .urls(() => "https://mojis.dev/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    vi.mocked(handlers.metadata).handlers.push(
      [(version: string) => version === "15.0", mockHandler],
      [(version: string) => version === "14.0", mockHandler2],
    );

    const result = await runAdapterHandler("metadata", { ...mockContext, force: true });
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler2" });
  });
});
