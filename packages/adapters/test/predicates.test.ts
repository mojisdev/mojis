import { describe, expect, it } from "vitest";
import {
  all,
  always,
  any,
  between,
  excludeVersions,
  greaterThan,
  lessThan,
  matchVersions,
  never,
} from "../src/predicates";

describe("predicates", () => {
  it("always()", () => {
    expect(always("1.0")).toBe(true);
    expect(always("2.0")).toBe(true);
    expect(always("3.0")).toBe(true);
  });

  it("never()", () => {
    expect(never("1.0")).toBe(false);
    expect(never("2.0")).toBe(false);
    expect(never("3.0")).toBe(false);
  });

  it("greaterThan()", () => {
    const predicate = greaterThan("2.0");
    expect(predicate("1.0")).toBe(false);
    expect(predicate("2.0")).toBe(false);
    expect(predicate("3.0")).toBe(true);
  });

  it("lessThan()", () => {
    const predicate = lessThan("2.0");
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(false);
    expect(predicate("3.0")).toBe(false);
  });

  it("matchVersions()", () => {
    const predicate = matchVersions(["1.0", "2.0"]);
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(true);
    expect(predicate("3.0")).toBe(false);
  });

  it("between()", () => {
    const predicate = between("1.0", "3.0");
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(true);
    expect(predicate("3.0")).toBe(true);
    expect(predicate("4.0")).toBe(false);
  });

  describe("all() with multiple predicates", () => {
    it("all()", () => {
      const predicate = all(
        greaterThan("1.0"),
        lessThan("3.0"),
      );
      expect(predicate("1.0")).toBe(false);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });

    it("all() with empty predicates", () => {
      const predicate = all();
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(true);
    });

    it("all() with alwaysTrue predicate", () => {
      const predicate = all(always, lessThan("3.0"));
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });
  });

  describe("any() with multiple predicates", () => {
    it("any() should pass if any predicate is true", () => {
      const predicate = any(
        lessThan("2.0"),
        greaterThan("2.0"),
      );
      expect(predicate("1.0")).toBe(true);
      expect(predicate("3.0")).toBe(true);
      expect(predicate("2.0")).toBe(false);
    });

    it("any() with empty predicates", () => {
      const predicate = any();
      expect(predicate("1.0")).toBe(false);
      expect(predicate("2.0")).toBe(false);
      expect(predicate("3.0")).toBe(false);
    });

    it("any() with always predicate", () => {
      const predicate = any(always, lessThan("3.0"));
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(true);
    });

    it("any() with never predicate", () => {
      const predicate = any(never, lessThan("3.0"));
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });
  });

  it("excludeVersions()", () => {
    const predicate = excludeVersions(["1.0", "2.0"]);
    expect(predicate("1.0")).toBe(false);
    expect(predicate("2.0")).toBe(false);
    expect(predicate("3.0")).toBe(true);
  });
});
