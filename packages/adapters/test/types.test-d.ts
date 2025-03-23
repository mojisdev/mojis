import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { AdapterContext, GetParseOptionsFromParser, ParserFn } from "../src/types";
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
