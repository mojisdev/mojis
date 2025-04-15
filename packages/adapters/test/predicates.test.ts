import { describe, expect, it } from "vitest";
import {
  alwaysFalse,
  alwaysTrue,
  and,
  onlyGreaterThan,
  onlyLessThan,
  onlyVersions,
  or,
  versionRange,
} from "../src/predicates";

describe("predicates", () => {
  it("alwaysTrue()", () => {
    expect(alwaysTrue("1.0")).toBe(true);
    expect(alwaysTrue("2.0")).toBe(true);
    expect(alwaysTrue("3.0")).toBe(true);
  });

  it("alwaysFalse()", () => {
    expect(alwaysFalse("1.0")).toBe(false);
    expect(alwaysFalse("2.0")).toBe(false);
    expect(alwaysFalse("3.0")).toBe(false);
  });

  it("onlyGreaterThan()", () => {
    const predicate = onlyGreaterThan("2.0");
    expect(predicate("1.0")).toBe(false);
    expect(predicate("2.0")).toBe(false);
    expect(predicate("3.0")).toBe(true);
  });

  it("onlyLessThan()", () => {
    const predicate = onlyLessThan("2.0");
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(false);
    expect(predicate("3.0")).toBe(false);
  });

  it("onlyVersions()", () => {
    const predicate = onlyVersions(["1.0", "2.0"]);
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(true);
    expect(predicate("3.0")).toBe(false);
  });

  it("versionRange()", () => {
    const predicate = versionRange("1.0", "3.0");
    expect(predicate("1.0")).toBe(true);
    expect(predicate("2.0")).toBe(true);
    expect(predicate("3.0")).toBe(true);
    expect(predicate("4.0")).toBe(false);
  });

  describe("and() with multiple predicates", () => {
    it("and()", () => {
      const predicate = and(
        onlyGreaterThan("1.0"),
        onlyLessThan("3.0"),
      );
      expect(predicate("1.0")).toBe(false);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });

    it("and() with empty predicates", () => {
      const predicate = and();
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(true);
    });
  });

  describe("or() with multiple predicates", () => {
    it("or()", () => {
      const predicate = or(
        onlyGreaterThan("1.0"),
        onlyLessThan("3.0"),
      );
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });

    it("or() with empty predicates", () => {
      const predicate = or();
      expect(predicate("1.0")).toBe(false);
      expect(predicate("2.0")).toBe(false);
      expect(predicate("3.0")).toBe(false);
    });

    it("or() with alwaysTrue predicate", () => {
      const predicate = or(alwaysTrue, onlyLessThan("3.0"));
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(true);
    });

    it("or() with alwaysFalse predicate", () => {
      const predicate = or(alwaysFalse, onlyLessThan("3.0"));
      expect(predicate("1.0")).toBe(true);
      expect(predicate("2.0")).toBe(true);
      expect(predicate("3.0")).toBe(false);
    });
  });
});
