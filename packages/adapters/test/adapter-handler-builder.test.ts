import type { AdapterContext } from "../src/global-types";
import { describe, expect, it } from "vitest";
import { createAdapterHandlerBuilder } from "../src/adapter-builder/builder";

describe("adapter handler builder", () => {
  const emptyContext = {} as AdapterContext;

  it("creates with type", () => {
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder.build();
    expect(handler.adapterType).toBe("metadata");
  });

  it("creates with empty handlers", () => {
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder.build();
    expect(handler.handlers).toHaveLength(0);
  });

  it("adds version handler", () => {
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder
      .onVersion(
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
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder
      .onVersion(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .onVersion(
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
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder
      .onVersion(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .onVersion(
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
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder
      .onVersion(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .onVersion(
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
    const builder = createAdapterHandlerBuilder({ type: "metadata" });
    const handler = builder
      .onVersion(
        (version) => version === "15.0",
        (builder) => builder
          .urls(() => "v15")
          .parser("generic")
          .output((_, data) => data),
      )
      .onVersion(
        (version) => version === "14.0",
        (builder) => builder
          .urls(() => "v14")
          .parser("generic")
          .output((_, data) => data),
      )
      .onVersion(
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
});
