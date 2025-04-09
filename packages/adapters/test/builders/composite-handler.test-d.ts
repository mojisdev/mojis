/* eslint-disable ts/consistent-type-definitions */
/* eslint-disable ts/no-empty-object-type */

import type {
  MergeSources,
} from "../../src/builders/composite-builder/types";
import type { CreateAdapterVersionHandler, CreateAnyAdapterHandler } from "../test-utils";
import { describe, expectTypeOf, it } from "vitest";

describe("MergeSources", () => {
  it("should handle empty sources", () => {
    type Source1 = {};
    type Source2 = [];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("should merge sources with same keys", () => {
    type Source1 = {
      version: () => string;
      hello: () => string;
    };

    type Source2 = [
      CreateAnyAdapterHandler<"version", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string;
          }>,
        ];
      }>,
      CreateAnyAdapterHandler<"world", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string;
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;
    //    ^?

    expectTypeOf<Result>().toEqualTypeOf<{
      version: string;
      hello: string;
      world: string;
    }>();
  });
});
