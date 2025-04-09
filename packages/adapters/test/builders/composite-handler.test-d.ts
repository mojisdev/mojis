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
            output: number;
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
      version: number;
      hello: string;
      world: string;
    }>();
  });

  it("should handle source with only adapter sources", () => {
    type Source1 = {};

    type Source2 = [
      CreateAnyAdapterHandler<"version", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string;
          }>,
        ];
      }>,
      CreateAnyAdapterHandler<"hello", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: number;
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      version: string;
      hello: number;
    }>();
  });

  it("should handle different output types", () => {
    type Source1 = {
      string: () => string;
      number: () => number;
      boolean: () => boolean;
    };

    type Source2 = [
      CreateAnyAdapterHandler<"array", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string[];
          }>,
        ];
      }>,
      CreateAnyAdapterHandler<"object", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: { key: string };
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      string: string;
      number: number;
      boolean: boolean;
      array: string[];
      object: { key: string };
    }>();
  });

  it("should prioritize adapter sources over regular sources for overlapping keys", () => {
    type Source1 = {
      version: () => number;
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
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      version: string;
      hello: string;
    }>();
  });

  it("should handle complex nested adapter handlers", () => {
    type Source1 = {
      simple: () => string;
    };

    type Source2 = [
      CreateAnyAdapterHandler<"complex", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: {
              nested: {
                value: number;
                array: string[];
              };
            };
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      simple: string;
      complex: {
        nested: {
          value: number;
          array: string[];
        };
      };
    }>();
  });

  it("should handle string literals as CompositeSource", () => {
    type Source1 = {
      literal1: "hello";
      literal2: "world";
      fn: () => string;
    };

    type Source2 = [
      CreateAnyAdapterHandler<"dynamic", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string;
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      literal1: "hello";
      literal2: "world";
      fn: string;
      dynamic: string;
    }>();
  });

  it("should handle multiple adapter handlers with the same adapterType", () => {
    type Source1 = {};

    type Source2 = [
      CreateAnyAdapterHandler<"same", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: string;
          }>,
        ];
      }>,
      CreateAnyAdapterHandler<"same", {
        handlers: [
          CreateAdapterVersionHandler<{
            output: number;
          }>,
        ];
      }>,
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      same: number | string;
    }>();
  });
});
