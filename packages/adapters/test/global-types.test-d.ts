import type { GenericParseOptions } from "@mojis/parsers";
import type { GetParseOptionsFromParser } from "../src/builders/version-builder/types";
import type { JoinTuples } from "../src/global-types";
import { describe, expectTypeOf, it } from "vitest";

describe("GetParseOptionsFromParser", () => {
  it("should return options if using valid parser", () => {
    type Result = GetParseOptionsFromParser<"generic">;
    expectTypeOf<Result>().toEqualTypeOf<GenericParseOptions>();
  });

  it("invalid parser should return never", () => {
    type Result = GetParseOptionsFromParser<"unknown">;
    expectTypeOf<Result>().toEqualTypeOf<never>();
  });
});

describe("JoinTuples", () => {
  it("should join tuples", () => {
    type Result = JoinTuples<[[1, 2, 3], [4, 5, 6]]>;
    expectTypeOf<Result>().toEqualTypeOf<[1, 2, 3, 4, 5, 6]>();
  });

  it("should join tuples with empty arrays", () => {
    type Result = JoinTuples<[[1, 2, 3], []]>;
    expectTypeOf<Result>().toEqualTypeOf<[1, 2, 3]>();
  });

  it("should join tuples with multiple empty arrays", () => {
    type Result = JoinTuples<[[1, 2, 3], [], []]>;
    expectTypeOf<Result>().toEqualTypeOf<[1, 2, 3]>();
  });
});
