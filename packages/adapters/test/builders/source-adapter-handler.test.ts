import type { AdapterContext } from "../../src/global-types";
import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { createSourceAdapter } from "../../src/builders/source-builder/builder";

const DUMMY_ARKTYPE_SCHEMA = type({
  name: "string",
});

describe("adapter handler builder", () => {
  const emptyContext = {} as AdapterContext;

  it("creates with type", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });
    const handler = builder.build();
    expect(handler.adapterType).toBe("metadata");
  });

  it("creates with empty handlers", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });
    const handler = builder.build();
    expect(handler.handlers).toHaveLength(0);
  });

  it("adds version handler", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });

    const handler = builder
      .withTransform(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "https://example.com")
          .parser("generic")
          .output((_, data) => data),
      )
      .build();

    expect(handler.handlers).toHaveLength(1);
    expect(handler.handlers[0][0]("15.0")).toBe(true);
  });

  it("adds multiple version handlers", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });

    const handler = builder
      .withTransform(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .withTransform(
        (version) => version === "14.0",
        (builder) => builder
          .urls(() => "v14")
          .parser("generic")
          .output((_, data) => data),
      )
      .build();

    expect(handler.handlers).toHaveLength(2);
    expect(handler.handlers[0][0]("15.0")).toBe(true);
    expect(handler.handlers[1][0]("14.0")).toBe(true);
  });

  it("maintains handler order", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });

    const handler = builder
      .withTransform(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .withTransform(
        (version) => version === "14.0",
        (builder) => builder
          .urls(() => "v14")
          .parser("generic")
          .output((_, data) => data),
      )
      .build();

    expect(handler.handlers[0][0]("15.0")).toBe(true);
    expect(handler.handlers[0][0]("14.0")).toBe(false);
    expect(handler.handlers[0][1].urls(emptyContext)).toBe("v15");

    expect(handler.handlers[1][0]("14.0")).toBe(true);
    expect(handler.handlers[1][0]("15.0")).toBe(false);
    expect(handler.handlers[1][1].urls(emptyContext)).toBe("v14");
  });

  it("preserves adapter type across chain", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });
    const handler = builder
      .withTransform(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .withTransform(
        (version) => version === "14.0",
        (builder) => builder
          .urls(() => "v14")
          .parser("generic")
          .output((_, data) => data),
      )
      .build();

    expect(handler.adapterType).toBe("metadata");
  });

  it("allows chaining multiple onVersion calls", () => {
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: DUMMY_ARKTYPE_SCHEMA,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });

    const handler = builder
      .withTransform(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .withTransform(
        (version) => version === "14.0",
        (builder) => builder
          .urls(() => "v14")
          .parser("generic")
          .output((_, data) => data),
      )
      .withTransform(
        (version) => version === "13.0",
        (builder) => builder
          .urls(() => "v13")
          .parser("generic")
          .output((_, data) => data),
      )
      .build();

    expect(handler.handlers).toHaveLength(3);
    expect(handler.handlers[0][0]("15.0")).toBe(true);
    expect(handler.handlers[1][0]("14.0")).toBe(true);
    expect(handler.handlers[2][0]("13.0")).toBe(true);
  });

  it("allows setting fallback data", () => {
    const fallbackData = { defaultValue: true };
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: type({
        defaultValue: "boolean",
      }),
      persistence: {
        schemas: {},
      },
      fallback: fallbackData,
    });

    const handler = builder
      .build();

    expect(handler.fallback).toEqual(fallbackData);
  });

  it("adds output schema for validation", () => {
    const testSchema = type({
      name: "string",
    });
    const builder = createSourceAdapter({
      type: "metadata",
      transformerOutputSchema: testSchema,
      persistence: {
        schemas: {},
      },
      fallback: {
        name: "default",
      },
    });
    const handler = builder.build();

    expect(handler.transformerOutputSchema).toBe(testSchema);
  });
});
