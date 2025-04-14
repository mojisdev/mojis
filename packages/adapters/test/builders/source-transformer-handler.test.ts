import type { GenericParseResult } from "@mojis/parsers";
import type { AdapterContext } from "../../src/global-types";
import { describe, expect, it } from "vitest";
import { createSourceTransformerBuilder } from "../../src/builders/source-transformer-builder/builder";

describe("version handler builder", () => {
  const emptyContext = {} as AdapterContext;

  it("creates basic handler", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .output((_, data) => data);

    expect(handler.urls(emptyContext)).toBe("https://example.com");
    expect(handler.parser).toBe("generic");
  });

  it("sets urls with cache options", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => ({
        url: "https://example.com",
        cacheKey: "test",
      }))
      .parser("generic")
      .output((_, data) => data);

    const result = handler.urls(emptyContext);
    expect(result).toEqual({
      url: "https://example.com",
      cacheKey: "test",
    });
  });

  it("sets parser with options", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic", { separator: ";" })
      .output((_, data) => data);

    expect(handler.parser).toBe("generic");
    expect(handler.parserOptions).toEqual({ separator: ";" });
  });

  it("transforms data", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .transform((_, data) => ({ ...data, transformed: true }))
      .output((_, data) => data);

    const inputData: GenericParseResult = { totalLines: 1, lines: [{ comment: "", fields: [], property: "" }] };
    const result = handler.transform(emptyContext, inputData);
    expect(result).toEqual({ ...inputData, transformed: true });
  });

  it("aggregates data", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .transform((_, data) => data)
      .aggregate((_, data) => data[0])
      .output((_, data) => data);

    const inputData: GenericParseResult[] = [
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 1"], property: "" }] },
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 2"], property: "" }] },
    ];
    const result = handler.aggregate(emptyContext, inputData);
    expect(result).toEqual(inputData[0]);
  });

  it("sets cache options", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .cacheOptions({ ttl: 3600 })
      .output((_, data) => data);

    expect(handler.cacheOptions).toEqual({ ttl: 3600 });
  });

  it("sets fetch options", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .fetchOptions({ method: "GET" })
      .output((_, data) => data);

    expect(handler.fetchOptions).toEqual({ method: "GET" });
  });

  it("chains all options", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => ({
        url: "https://example.com",
        cacheKey: "test",
      }))
      .parser("generic", { separator: ";" })
      .transform((_, data) => ({ ...data, transformed: true }))
      .aggregate((_, data) => data[0])
      .cacheOptions({ ttl: 3600 })
      .fetchOptions({ method: "GET" })
      .output((_, data) => data);

    expect(handler.urls(emptyContext)).toEqual({
      url: "https://example.com",
      cacheKey: "test",
    });
    expect(handler.parser).toBe("generic");
    expect(handler.parserOptions).toEqual({ separator: ";" });

    const inputData: GenericParseResult = { totalLines: 1, lines: [{ comment: "", fields: [], property: "" }] };
    expect(handler.transform(emptyContext, inputData)).toEqual({ ...inputData, transformed: true });

    const aggregateInput = [
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 1"], property: "" }], transformed: true },
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 2"], property: "" }], transformed: true },
    ];
    expect(handler.aggregate(emptyContext, aggregateInput)).toEqual(aggregateInput[0]);

    expect(handler.cacheOptions).toEqual({ ttl: 3600 });
    expect(handler.fetchOptions).toEqual({ method: "GET" });
  });

  it("maintains order of operations", () => {
    const handler = createSourceTransformerBuilder()
      .urls(() => "https://example.com")
      .parser("generic")
      .transform((_, data) => ({ ...data, step1: true, step2: true }))
      .aggregate((_, data) => ({ ...data[0], aggregated: true }))
      .output((_, data) => data);

    const inputData: GenericParseResult[] = [
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 1"], property: "" }] },
      { totalLines: 1, lines: [{ comment: "", fields: ["id: 2"], property: "" }] },
    ];

    // first transform each item
    const transformedData = inputData.map((data) => handler.transform(emptyContext, data));

    // then aggregate the transformed data
    const result = handler.aggregate(emptyContext, transformedData);

    expect(result).toEqual({
      ...inputData[0],
      aggregated: true,
      step1: true,
      step2: true,
    });
  });

  it("validates data", () => {
    const handler = createSourceTransformerBuilder<{
      id: string;
    }>()
      .urls(() => "https://example.com")
      .parser("generic")
      .transform(() => ({
        id: "hello-world",
      }))
      .output((_, data) => data);

    const result = handler.transform(emptyContext, { totalLines: 1, lines: [{ comment: "", fields: ["id: hello-world"], property: "" }] });
    expect(result).toEqual({ id: "hello-world" });
  });
});
