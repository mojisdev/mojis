import { describe, expect, it } from "vitest";
import { isAfterAlignment, isBefore, isBeforeAlignment } from "../src/predicates";

describe("alignment predicates", () => {
  describe("before", () => {
    it.each([
      { version: "10.0.0", expected: true },
      { version: "9.5.2", expected: true },
      { version: "11.0.0", expected: false },
      { version: "12.1.0", expected: false },
      { version: "11.0.1", expected: false },
      { version: "10.99.99", expected: true },
      { version: "11.0.0-alpha.1", expected: false },
      { version: "10.0.0-beta.5", expected: true },
      { version: "10.0.0+build.123", expected: true },
      { version: "11.0.0+build.123", expected: false },
      { version: "10", expected: true },
      { version: "11", expected: false },
      { version: "12", expected: false },
      { version: "10.1", expected: true },
      { version: "11.1", expected: false },
      { version: "12.1", expected: false },
      { version: "10.1.2", expected: true },
      { version: "11.1.2", expected: false },
      { version: "12.1.2", expected: false },
      { version: null, expected: false },
      { version: undefined, expected: false },
      { version: "", expected: false },
      { version: "abc", expected: false },
      { version: "1.2.3-rc.1+build.123", expected: true },
      { version: "11.0.0-rc.1+build.123", expected: false },
    ])("should return $expected for version $version", ({ version, expected }) => {
      expect(isBeforeAlignment(version as string)).toBe(expected);
    });
  });

  describe("after", () => {
    it.each([
      { version: "10.0.0", expected: false },
      { version: "11.0.0", expected: true },
      { version: "12.1.0", expected: true },
      { version: null, expected: true },
      { version: undefined, expected: true },
      { version: "", expected: true },
      { version: "abc", expected: true },
      { version: "10", expected: false },
      { version: "11", expected: true },
      { version: "12", expected: true },
      { version: "10.1", expected: false },
      { version: "11.1", expected: true },
      { version: "12.1", expected: true },
      { version: "10.1.2", expected: false },
      { version: "11.1.2", expected: true },
      { version: "12.1.2", expected: true },
      { version: "1.2.3-rc.1+build.123", expected: false },
      { version: "11.0.0-rc.1+build.123", expected: true },
    ])("should return $expected for version $version", ({ version, expected }) => {
      expect(isAfterAlignment(version as string)).toBe(expected);
    });
  });
});

describe("version predicates", () => {
  describe("is before", () => {
    it.each([
      { version: "10.0.0", target: "11.0.0", expected: true },
      { version: "11.0.0", target: "11.0.0", expected: false },
      { version: "11.0.0", target: "10.0.0", expected: false },
      { version: "10.0.0", target: "10.0.0", expected: false },
      { version: "10.0.0", target: "10.0.1", expected: true },
      { version: null, target: "11.0.0", expected: false },
      { version: undefined, target: "11.0.0", expected: false },
      { version: "abc", target: "11.0.0", expected: false },
      { version: "10.0.0", target: null, expected: false },
      { version: "10.0.0", target: undefined, expected: false },
    ])("should return $expected for version $version and target $target", ({ version, target, expected }) => {
      expect(isBefore(version as string, target as string)).toBe(expected);
    });
  });
});
