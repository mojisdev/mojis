import { describe, expect, it } from "vitest";
import { isUrlBuilder } from "../src/utils";

describe("url builder", () => {
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
});
