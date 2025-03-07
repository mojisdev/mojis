import { describe, expect, it } from "vitest";
import { isAfterAlignment, isBeforeAlignment } from "../src/predicates";

describe("alignment", () => {
  describe("before alignment", () => {
    it.each([null, undefined])("should return false when version is %s", (version) => {
      expect(isBeforeAlignment(version as unknown as string)).toBe(false);
    });

    it("should return false when version is not a valid semver", () => {
      expect(isBeforeAlignment("invalid-version")).toBe(false);
    });

    it.each(["12.0.0", "11.5.2", "0.1.0"])("should return true when version is %s (< 13)", (version) => {
      expect(isBeforeAlignment(version)).toBe(true);
    });

    it.each(["13.0.0", "14.0.0", "20.0.0"])("should return false when version is %s (>= 13)", (version) => {
      expect(isBeforeAlignment(version)).toBe(false);
    });

    it.each([
      ["v12.0.0", true],
      ["v13.0.0", false],
    ])("should handle version %s with prefix and return %s", (version, expected) => {
      expect(isBeforeAlignment(version)).toBe(expected);
    });
  });

  describe("after alignment", () => {
    it("should return the inverse of isBeforeAlignment", () => {
      expect(isAfterAlignment("12.0.0")).toBe(!isBeforeAlignment("12.0.0"));
      expect(isAfterAlignment("13.0.0")).toBe(!isBeforeAlignment("13.0.0"));
      expect(isAfterAlignment("invalid-version")).toBe(!isBeforeAlignment("invalid-version"));
    });
  });
});
