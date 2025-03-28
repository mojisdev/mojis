import { describe, expect, it } from "vitest";
import {
  EMOJI_SPEC_RECORD_SCHEMA,
} from "../src/emojis";

describe("zod: EMOJI_SPEC_RECORD_SCHEMA", () => {
  it("should validate a valid object", () => {
    const validObject = {
      emoji_version: "13.0",
      unicode_version: "13.0",
      draft: false,
      fallback: null,
    };
    expect(() => EMOJI_SPEC_RECORD_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should validate a valid object without fallback", () => {
    const validObject = {
      emoji_version: "13.0",
      unicode_version: "13.0",
      draft: false,
    };
    expect(() => EMOJI_SPEC_RECORD_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should invalidate an object with incorrect types", () => {
    const invalidObject = {
      emoji_version: 13.0,
      unicode_version: 13.0,
      draft: "false",
      fallback: 123,
    };

    expect(() => EMOJI_SPEC_RECORD_SCHEMA.parse(invalidObject)).toThrow();
  });

  it("should invalidate an object with missing fields", () => {
    const invalidObject = {
      emoji_version: "13.0",
      unicode_version: "13.0",
    };

    expect(() => EMOJI_SPEC_RECORD_SCHEMA.parse(invalidObject)).toThrow();
  });
});
