import { describe, expect, it } from "vitest";
import {
  GENERATOR_SCHEMA,
  SHORTCODE_PROVIDER_SCHEMA,
  SHORTCODE_PROVIDERS_SCHEMA,
} from "../src/index";

describe("zod: SHORTCODE_PROVIDER_SCHEMA", () => {
  it("should validate 'github'", () => {
    expect(() => SHORTCODE_PROVIDER_SCHEMA.parse("github")).not.toThrow();
  });

  it("should validate 'slack'", () => {
    expect(() => SHORTCODE_PROVIDER_SCHEMA.parse("slack")).not.toThrow();
  });

  it("should invalidate other strings", () => {
    expect(() => SHORTCODE_PROVIDER_SCHEMA.parse("invalid")).toThrow();
  });
});

describe("zod: SHORTCODE_PROVIDERS_SCHEMA", () => {
  it("should validate an array of valid providers", () => {
    const validArray = ["github", "slack"];
    expect(() => SHORTCODE_PROVIDERS_SCHEMA.parse(validArray)).not.toThrow();
  });

  it("should invalidate an array with invalid providers", () => {
    const invalidArray = ["github", "invalid"];
    expect(() => SHORTCODE_PROVIDERS_SCHEMA.parse(invalidArray)).toThrow();
  });

  it("should invalidate a non-array", () => {
    expect(() => SHORTCODE_PROVIDERS_SCHEMA.parse("github")).toThrow();
  });
});

describe("zod: GENERATOR_SCHEMA", () => {
  it.each([
    "metadata",
    "sequences",
    "emojis",
    "variations",
    "shortcodes",
    "unicode-names",
  ])("should validate '%s'", (value) => {
    expect(() => GENERATOR_SCHEMA.parse(value)).not.toThrow();
  });

  it("should invalidate other strings", () => {
    expect(() => GENERATOR_SCHEMA.parse("invalid")).toThrow();
  });
});
