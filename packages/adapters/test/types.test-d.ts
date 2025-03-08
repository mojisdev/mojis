import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { GetParseOptionsFromParser, GetParseOutputFromBuiltInParser } from "../src/types";
import { describe, expectTypeOf, it } from "vitest";

describe("GetParseOutputFromBuiltInParser", () => {
  it("generic should return ParseResult", () => {
    type Result = GetParseOutputFromBuiltInParser<"generic">;
    expectTypeOf<Result>().toEqualTypeOf<GenericParseResult>();
  });

  it("unknown parser should return never", () => {
    type Result = GetParseOutputFromBuiltInParser<"unknown">;
    expectTypeOf<Result>().toEqualTypeOf<never>();
  });
});

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
