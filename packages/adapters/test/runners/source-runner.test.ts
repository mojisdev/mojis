import type { AnySourceAdapter } from "../../src/builders/source-builder/types";
import type { AdapterContext } from "../../src/global-types";
import { HttpResponse, mockFetch } from "#msw-utils";
import { type } from "arktype";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSourceTransformerBuilder } from "../../src/builders/source-transformer-builder/builder";
import { createFakeSourceAdapter, setupAdapterTest } from "../__utils";

describe("runSourceAdapter", () => {
  const mockContext: AdapterContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  it("should throw error for invalid handler", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    await expect(
      runSourceAdapter({} as AnySourceAdapter, mockContext),
    ).rejects.toThrow();
  });

  it("should return undefined when no handlers match version", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);
    expect(result).toBeUndefined();
  });

  it("should run matching version handler", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-matching-version-handler/1",
        () => HttpResponse.text("mojis.dev/run-matching-version-handler/1"),
      ],
      [
        "GET https://mojis.dev/run-matching-version-handler/2",
        () => HttpResponse.text("mojis.dev/run-matching-version-handler/2"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-matching-version-handler/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-matching-version-handler/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler],
        [(version: string) => version === "14.0", mockHandler2],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should run first matching version handler when multiple match", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-first-matching-version-handler/1",
        () =>
          HttpResponse.text("mojis.dev/run-first-matching-version-handler/1"),
      ],
      [
        "GET https://mojis.dev/run-first-matching-version-handler/2",
        () =>
          HttpResponse.text("mojis.dev/run-first-matching-version-handler/2"),
      ],
      [
        "GET https://mojis.dev/run-first-matching-version-handler/3",
        () =>
          HttpResponse.text("mojis.dev/run-first-matching-version-handler/3"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler1 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-first-matching-version-handler/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-first-matching-version-handler/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler3 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-first-matching-version-handler/3")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler3" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler1],
        [(version: string) => version === "15.0", mockHandler2],
        [(version: string) => version === "14.0", mockHandler3],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle multiple URLs", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-multiple-urls/1",
        () => HttpResponse.text("mojis.dev/run-multiple-urls/1"),
      ],
      [
        "GET https://mojis.dev/run-multiple-urls/2",
        () => HttpResponse.text("mojis.dev/run-multiple-urls/2"),
      ],
      [
        "GET https://mojis.dev/run-multiple-urls/3",
        () => HttpResponse.text("mojis.dev/run-multiple-urls/3"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder()
      .urls(() => [
        "https://mojis.dev/run-multiple-urls/1",
        "https://mojis.dev/run-multiple-urls/2",
      ])
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .aggregate((_, data) => data)
      .output((_, data) => ({ processedBy: data[0]?.processed }));

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-multiple-urls/3")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler],
        [(version: string) => version === "14.0", mockHandler2],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);
    expectTypeOf(result).toEqualTypeOf<{
      processedBy: string;
    } | {
      processedBy: string | undefined;
    }>();
    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle transformation and aggregation", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-transformation-and-aggregation/1",
        () =>
          HttpResponse.text("mojis.dev/run-transformation-and-aggregation/1"),
      ],
      [
        "GET https://mojis.dev/run-transformation-and-aggregation/2",
        () =>
          HttpResponse.text("mojis.dev/run-transformation-and-aggregation/2"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-transformation-and-aggregation/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, transformed: true }))
      .aggregate((_, data) => ({ ...data[0], aggregated: true }))
      .output((_, data) => data);

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-transformation-and-aggregation/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, transformed: true }))
      .aggregate((_, data) => ({ ...data[0], aggregated: true }))
      .output((_, data) => data);

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler],
        [(version: string) => version === "14.0", mockHandler2],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);

    expect(result).toBeDefined();
    expect(result).toEqual({
      transformed: true,
      aggregated: true,
      lines: expect.any(Array),
      totalLines: expect.any(Number),
    });
  });

  it("should handle cache and fetch options", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-cache-and-fetch-options/1",
        () => HttpResponse.text("mojis.dev/run-cache-and-fetch-options/1"),
      ],
      [
        "GET https://mojis.dev/run-cache-and-fetch-options/2",
        () => HttpResponse.text("mojis.dev/run-cache-and-fetch-options/2"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-cache-and-fetch-options/1")
      .parser("generic")
      .cacheOptions({ ttl: 3600 })
      .fetchOptions({ method: "GET" })
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-cache-and-fetch-options/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler],
        [(version: string) => version === "14.0", mockHandler2],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);

    expect(result).toBeDefined();
    expect(result).toEqual({ processedBy: "handler1" });
  });

  it("should handle force mode", async () => {
    mockFetch([
      [
        "GET https://mojis.dev/run-force-mode/1",
        () => HttpResponse.text("mojis.dev/run-force-mode/1"),
      ],
      [
        "GET https://mojis.dev/run-force-mode/2",
        () => HttpResponse.text("mojis.dev/run-force-mode/2"),
      ],
    ]);

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler1 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-force-mode/1")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler1" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const mockHandler2 = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/run-force-mode/2")
      .parser("generic")
      .transform((_, data) => ({ ...data, processed: "handler2" }))
      .output((_, data) => ({ processedBy: data.processed }));

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        // add two handlers for different versions
        // only the first one should match the normal context
        [(version: string) => version === "15.0", mockHandler1],
        [(version: string) => version === "14.0", mockHandler2],
      ],
    });

    // test normal behavior (without force)
    const normalResult = await runSourceAdapter(handler, mockContext);
    expect(normalResult).toBeDefined();
    expect(normalResult).toEqual({ processedBy: "handler1" });

    // test with force - this should still use handler1 as it's the first match for our version,
    // but we need to check that it's actually hit the network instead of using cache
    // we can't test the cache bypassing directly in this test, but we can verify the right handler was used
    const forceResult = await runSourceAdapter(handler, {
      ...mockContext,
      force: true,
    });
    expect(forceResult).toBeDefined();
    expect(forceResult).toEqual({ processedBy: "handler1" });
  });

  it("should bypass cache in force mode", async () => {
    // setup fetch with different responses for the same URL
    // first call returns one value, second call returns another
    let fetchCounter = 0;
    mockFetch("GET https://mojis.dev/test", () => {
      fetchCounter++;
      return HttpResponse.text(`Response ${fetchCounter}`);
    });

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder()
      .urls(() => "https://mojis.dev/test")
      .parser("generic")
      .cacheOptions({ ttl: 3600 })
      .transform((_, data) => data.lines[0]?.fields[0])
      .output((_, data) => data);

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [(version: string) => version === "15.0", mockHandler],
      ],
    });

    // first request should get "Response 1"
    const result1 = await runSourceAdapter(handler, mockContext);
    expect(result1).toBeDefined();
    expect(result1).toContain("Response 1");

    // second request with normal context should get cached "Response 1"
    const result2 = await runSourceAdapter(handler, mockContext);
    expect(result2).toBeDefined();
    expect(result2).toContain("Response 1");

    // request with force=true should bypass cache and get "Response 2"
    const forceResult = await runSourceAdapter(handler, {
      ...mockContext,
      force: true,
    });
    expect(forceResult).toBeDefined();
    expect(forceResult).toContain("Response 2");

    // verify we actually made 2 requests, not 3 (as one was cached)
    expect(fetchCounter).toBe(2);
  });

  it("should handle validation", async () => {
    mockFetch("GET https://mojis.dev/handle-validation", () =>
      HttpResponse.text("mojis.dev/handle-validation"));

    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder<{
      page?: string;
    }>()
      .urls(() => "https://mojis.dev/handle-validation")
      .parser("generic")
      .transform((_, data) => ({
        page: data.lines[0]?.fields[0],
      }))
      .output((_, data) => data);

    const predicate = (version: string) => version === "15.0";

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [predicate, mockHandler],
      ],
    });

    const result = await runSourceAdapter(handler, mockContext);
    expect(result).toBeDefined();
    expect(result).toEqual({ page: "mojis.dev/handle-validation" });
  });

  it("should throw if validation fails", async () => {
    mockFetch("GET https://mojis.dev/handle-validation-fail", () =>
      HttpResponse.text("mojis.dev/handle-validation-fail"));
    const { runSourceAdapter } = await setupAdapterTest();

    const mockHandler = createSourceTransformerBuilder<{
      page1: string;
    }>()
      .urls(() => "https://mojis.dev/handle-validation-fail")
      .parser("generic")
      .transform((_, data) => ({
        page: data.lines[0]?.fields[0],
      }))
      // @ts-expect-error - we are intentionally testing the validation failure
      .output((_, data) => data);

    const predicate = (version: string) => version === "15.0";

    const handler = createFakeSourceAdapter({
      adapterType: "metadata",
      handlers: [
        [predicate, mockHandler],
      ],
      transformerOutputSchema: type({
        page1: "string",
      }),
    });

    await expect(runSourceAdapter(handler, mockContext)).rejects.toThrow(
      "Invalid output for handler: metadata",
    );
  });
});
