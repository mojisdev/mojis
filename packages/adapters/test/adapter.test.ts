import type { MojiAdapter } from "../src/types";
import { describe, expect, it } from "vitest";
import { defineMojiAdapter } from "../src/define-adapter";

function screwAdapterTypes<T extends Partial<Record<keyof MojiAdapter, unknown>>>(adapter: T): MojiAdapter {
  return adapter as unknown as MojiAdapter;
}

describe("define moji adapters", () => {
  it("should validate a valid adapter", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      description: "Test adapter",
      range: ">=1.0.0",
      sequences: () => [],
    });
    expect(() => defineMojiAdapter(adapter)).not.toThrow();
  });

  it("should throw if name is missing", () => {
    const adapter = screwAdapterTypes({
      description: "Test adapter",
      range: ">=1.0.0",
      sequences: () => [],
    });
    expect(() => defineMojiAdapter(adapter)).toThrow("adapter.name is required");
  });

  it("should throw if description is missing", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      range: ">=1.0.0",
      sequences: () => [],
    });

    expect(() => defineMojiAdapter(adapter)).toThrow("adapter.description is required");
  });

  it("should throw if range is missing", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      description: "Test adapter",
      sequences: () => [],
    });

    expect(() => defineMojiAdapter(adapter)).toThrow("adapter.range is required");
  });

  it("should throw if range is invalid", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      description: "Test adapter",
      range: "invalid",
      sequences: () => [],
    });

    expect(() => defineMojiAdapter(adapter)).toThrow("adapter.range is not a valid semver range invalid");
  });

  it("should throw if required functions are missing without extend", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      description: "Test adapter",
      range: ">=1.0.0",
    });

    expect(() => defineMojiAdapter(adapter)).toThrow("adapter test is missing required functions: sequences");
  });

  it("should not validate required functions if extend is provided", () => {
    const adapter = screwAdapterTypes({
      name: "test",
      description: "Test adapter",
      range: ">=1.0.0",
      extend: "base",
    });

    expect(() => defineMojiAdapter(adapter)).not.toThrow();
  });
});
