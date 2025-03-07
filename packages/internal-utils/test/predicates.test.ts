import { describe, expect, it } from "vitest";
import { isAfterAlignment, isBeforeAlignment } from "../src/predicates";

describe("isBeforeAlignment", () => {
  it("should return false when version is null", () => {
    expect(isBeforeAlignment(null as unknown as string)).toBe(false);
  });

  it("should return false when version is undefined", () => {
    expect(isBeforeAlignment(undefined as unknown as string)).toBe(false);
  });

  it("should return false when version is not a valid semver", () => {
    expect(isBeforeAlignment("invalid-version")).toBe(false);
  });

  it("should return true when major version is less than 13", () => {
    expect(isBeforeAlignment("12.0.0")).toBe(true);
    expect(isBeforeAlignment("11.5.2")).toBe(true);
    expect(isBeforeAlignment("0.1.0")).toBe(true);
  });

  it("should return false when major version is equal to or greater than 13", () => {
    expect(isBeforeAlignment("13.0.0")).toBe(false);
    expect(isBeforeAlignment("14.0.0")).toBe(false);
    expect(isBeforeAlignment("20.0.0")).toBe(false);
  });

  it("should handle version strings with prefixes", () => {
    expect(isBeforeAlignment("v12.0.0")).toBe(true);
    expect(isBeforeAlignment("v13.0.0")).toBe(false);
  });
});

describe("isAfterAlignment", () => {
  it("should return the inverse of isBeforeAlignment", () => {
    expect(isAfterAlignment("12.0.0")).toBe(!isBeforeAlignment("12.0.0"));
    expect(isAfterAlignment("13.0.0")).toBe(!isBeforeAlignment("13.0.0"));
    expect(isAfterAlignment("invalid-version")).toBe(!isBeforeAlignment("invalid-version"));
  });
});
