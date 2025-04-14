import type { GenericParseOptions } from "@mojis/parsers";
import type { PredicateFn } from "../src/builders/source-builder/types";
import type { AnySourceTransformer, GetParseOptionsFromParser } from "../src/builders/version-builder/types";
import type { MergeTuple } from "../src/global-types";
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
    type Result = MergeTuple<[1, 2, 3], [4, 5, 6]>;
    expectTypeOf<Result>().toEqualTypeOf<[1, 2, 3, 4, 5, 6]>();
  });

  it("should join tuples with empty arrays", () => {
    type Result = MergeTuple<[1, 2, 3], []>;
    expectTypeOf<Result>().toEqualTypeOf<[1, 2, 3]>();
  });

  it("should join tuples with multiple empty arrays", () => {
    type Result = MergeTuple<[], []>;
    expectTypeOf<Result>().toEqualTypeOf<[]>();
  });

  it("should join tuples with nested tuples", () => {
    type Result = MergeTuple<
      [[1, 2, 3], [4, 5, 6]],
      [[7, 8, 9], [10, 11, 12]]
    >;
    expectTypeOf<Result>().toEqualTypeOf<[
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ]>();
  });

  it("merge adapter handlers", () => {
    type Handlers = [
      [PredicateFn, AnySourceTransformer],
      [PredicateFn, AnySourceTransformer],
    ];

    type Result = MergeTuple<
      Handlers,
      [[PredicateFn, AnySourceTransformer]]
    >;

    expectTypeOf<Result>().toExtend<[
      [PredicateFn, AnySourceTransformer],
      [PredicateFn, AnySourceTransformer],
      [PredicateFn, AnySourceTransformer],
    ]>();
  });
});
