import { describe, expect, it } from "vitest";
import {
  EMOJI_GROUP_SCHEMA,
  EMOJI_METADATA_SCHEMA,
  EMOJI_SEQUENCE_SCHEMA,
  EMOJI_SPEC_RECORD_SCHEMA,
  EMOJI_VARIATION_SCHEMA,
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

describe("zod: EMOJI_GROUP_SCHEMA", () => {
  it("should validate a valid object", () => {
    const validObject = {
      name: "smileys-and-people",
      slug: "smileys-and-people",
      subgroups: ["face-smiling"],
    };
    expect(() => EMOJI_GROUP_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should invalidate an object with missing fields", () => {
    const invalidObject = {
      name: "smileys-and-people",
    };

    expect(() => EMOJI_GROUP_SCHEMA.parse(invalidObject)).toThrow();
  });

  it("should invalidate an object with incorrect types", () => {
    const invalidObject = {
      name: 123,
    };

    expect(() => EMOJI_GROUP_SCHEMA.parse(invalidObject)).toThrow();
  });
});

describe("zod: EMOJI_METADATA_SCHEMA", () => {
  it("should validate a valid object", () => {
    const validObject = {
      group: "smileys-and-people",
      subgroup: "face-smiling",
      qualifier: "neutral",
      unicodeVersion: "13.0",
      emojiVersion: "13.0",
      description: "waving hand",
      emoji: "👋",
      hexcodes: ["1f44b"],
    };

    expect(() => EMOJI_METADATA_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should invalidate an object with missing fields", () => {
    const invalidObject = {
      group: "smileys-and-people",
      subgroup: "face-smiling",
      qualifier: "neutral",
      unicodeVersion: "13.0",
      emojiVersion: "13.0",
      description: "waving hand",
      emoji: "👋",
    };

    expect(() => EMOJI_METADATA_SCHEMA.parse(invalidObject)).toThrow();
  });

  it("should invalidate an object with incorrect types", () => {
    const invalidObject = {
      name: 123,
    };

    expect(() => EMOJI_METADATA_SCHEMA.parse(invalidObject)).toThrow();
  });
});

describe("zod: EMOJI_SEQUENCE_SCHEMA", () => {
  it("should validate a valid object", () => {
    const validObject = {
      property: "hello",
      hex: "1f44b",
      description: "waving hand",
      gender: "neutral",
    };

    expect(() => EMOJI_SEQUENCE_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should invalidate an object with missing fields", () => {
    const invalidObject = {
      property: "hello",
      hex: "1f44b",
    };

    expect(() => EMOJI_SEQUENCE_SCHEMA.parse(invalidObject)).toThrow();
  });

  it("should invalidate an object with incorrect types", () => {
    const invalidObject = {
      name: 123,
    };

    expect(() => EMOJI_SEQUENCE_SCHEMA.parse(invalidObject)).toThrow();
  });
});

describe("zod: EMOJI_VARIATION_SCHEMA", () => {
  it("should validate a valid object", () => {
    const validObject = {
      text: "smileys-and-people",
      emoji: "👋",
      property: ["hello", "world"],
    };

    expect(() => EMOJI_VARIATION_SCHEMA.parse(validObject)).not.toThrow();
  });

  it("should invalidate an object with missing fields", () => {
    const invalidObject = {};

    expect(() => EMOJI_VARIATION_SCHEMA.parse(invalidObject)).toThrow();
  });

  it("should invalidate an object with incorrect types", () => {
    const invalidObject = {
      text: 123,
      property: "hello",
    };

    expect(() => EMOJI_VARIATION_SCHEMA.parse(invalidObject)).toThrow();
  });
});
