import { describe, expect, it } from "vitest";
import { BUILTIN_PARSERS, isBuiltinParser, isUrlBuilder } from "../src/utils";

describe("is url builder", () => {
  it.each([
    [
      () => "https://example.com",
      true,
    ],
    [
      "https://example.com",
      false,
    ],
  ])("should return %p for %p", (value, expected) => {
    expect(isUrlBuilder(value)).toBe(expected);
  });
});

describe("is builtin parser", () => {
  it.each([
    ...(BUILTIN_PARSERS.map((parser) => [parser, true] as [string, boolean])),

    // not valid parser
    [
      "not a builtin parser",
      false,
    ],
    [
      () => "splitter",
      false,
    ],
  ])("should return %p for %p", (value, expected) => {
    expect(isBuiltinParser(value)).toBe(expected);
  });
});
