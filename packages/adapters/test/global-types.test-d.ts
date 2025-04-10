import type { GenericParseOptions } from "@mojis/parsers";
import type { GetParseOptionsFromParser } from "../src/builders/version-builder/types";
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
