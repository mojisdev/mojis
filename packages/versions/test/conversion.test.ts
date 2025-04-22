import { describe, expect, it } from "vitest";
import {
  mapEmojiVersionToUnicodeVersion,
  toSemverCompatible,
} from "../src/conversion";

describe("mapEmojiVersionToUnicode", () => {
  it.each([
    { input: "1.0", expected: "8.0" },
    { input: "15.0", expected: "15.0" },
    { input: "15.1", expected: "15.1" },
    { input: "13.1", expected: "13.0" },
  ])("$input -> $expected", ({ input, expected }) => {
    expect(mapEmojiVersionToUnicodeVersion(input)).toBe(expected);
  });
});

describe("toSemverCompatible", () => {
  it.each([
    { input: "1.0", expected: "1.0.0" },
    { input: "15.0", expected: "15.0.0" },
    { input: "15.1", expected: "15.1.0" },
    { input: "13.1", expected: "13.1.0" },
    { input: "x.0.0", expected: "0.0.0" }, // correctly coerced to 0.0.0
    { input: "1.2.3", expected: "1.2.3" }, // full semver
    { input: "v2.0.0", expected: "2.0.0" }, // leading "v"
    { input: "3.1.4-alpha", expected: "3.1.4-alpha" }, // extra characters
    { input: "1.0.0+build.123", expected: "1.0.0" }, // build metadata
    { input: "1.2.0-beta.1", expected: "1.2.0-beta.1" }, // prerelease
  ])("convert $input to semver compatible version $expected", ({ input, expected }) => {
    expect(toSemverCompatible(input)).toBe(expected);
  });

  it.each([
    { input: "invalid-version", expected: null },
    { input: "", expected: null },
    { input: null as any, expected: null },
    { input: undefined as any, expected: null },
  ])(
    "should return null for invalid input: $input",
    ({ input, expected }) => {
      expect(toSemverCompatible(input)).toBe(expected);
    },
  );
});
