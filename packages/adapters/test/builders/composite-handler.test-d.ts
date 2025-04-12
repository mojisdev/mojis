/* eslint-disable ts/consistent-type-definitions */
/* eslint-disable ts/no-empty-object-type */

import type {
  CompositeTransformFn,
  MergeSources,
  TransformChain,
} from "../../src/builders/composite-builder/types";
import type { UnsetMarker } from "../../src/global-types";
import type { CreateVersionedSourceTransformer, CreateAnySourceAdapter } from "../__utils";
import { describe, expectTypeOf, it } from "vitest";

type LengthOf<T extends any[]> = T["length"] extends infer L
  ? L extends number
    ? L
    : never
  : never;

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
      CreateAnySourceAdapter<"version", {
        handlers: [
          CreateVersionedSourceTransformer<{
            output: number;
          }>,
        ];
      }>,
      CreateAnySourceAdapter<"world", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"version", {
        handlers: [
          CreateVersionedSourceTransformer<{
            output: string;
          }>,
        ];
      }>,
      CreateAnySourceAdapter<"hello", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"array", {
        handlers: [
          CreateVersionedSourceTransformer<{
            output: string[];
          }>,
        ];
      }>,
      CreateAnySourceAdapter<"object", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"version", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"complex", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"dynamic", {
        handlers: [
          CreateVersionedSourceTransformer<{
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
      CreateAnySourceAdapter<"same", {
        handlers: [
          CreateVersionedSourceTransformer<{
            output: string;
          }>,
        ];
      }>,
      CreateAnySourceAdapter<"same", {
        handlers: [
          CreateVersionedSourceTransformer<{
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

  describe("unset markers", () => {
    it("should handle unset markers in sources", () => {
      type Source1 = {
        version: () => string;
      };

      type Source2 = UnsetMarker;

      type Result = MergeSources<Source1, Source2>;

      expectTypeOf<Result>().toEqualTypeOf<{
        version: string;
      }>();
    });

    it("should handle unset markers in adapter sources", () => {
      type Source1 = UnsetMarker;

      type Source2 = [
        CreateAnySourceAdapter<"version", {
          handlers: [
            CreateVersionedSourceTransformer<{
              output: string;
            }>,
          ];
        }>,
      ];

      type Result = MergeSources<Source1, Source2>;

      expectTypeOf<Result>().toEqualTypeOf<{
        version: string;
      }>();
    });
  });
});

describe("TransformChain", () => {
  it("should create a properly typed transform chain", () => {
    type SourceData = { name: string; age: number };
    type TransformOutputs = [string, number, boolean];

    type Result = TransformChain<SourceData, TransformOutputs>;
    //    ^?

    expectTypeOf<Result>().toBeArray();
    expectTypeOf<LengthOf<Result>>().toEqualTypeOf<3>();

    // verify function signatures
    expectTypeOf<Result[0]>().toExtend<CompositeTransformFn<SourceData, string>>();
    expectTypeOf<Result[1]>().toExtend<CompositeTransformFn<string, number>>();
    expectTypeOf<Result[2]>().toExtend<CompositeTransformFn<number, boolean>>();
  });

  it("should handle empty transform arrays", () => {
    type SourceData = { name: string };
    type EmptyTransforms = [];

    type Result = TransformChain<SourceData, EmptyTransforms>;

    expectTypeOf<Result>().toBeArray();
    expectTypeOf<LengthOf<Result>>().toEqualTypeOf<0>();
  });

  it("should handle complex object types", () => {
    interface Person { name: string; age: number }
    interface Address { street: string; city: string }
    interface CompleteProfile { person: Person; address: Address }

    type TransformOutputs = [Person, Address, CompleteProfile];

    type Result = TransformChain<{ rawData: string }, TransformOutputs>;

    expectTypeOf<Result>().toBeArray();
    expectTypeOf<LengthOf<Result>>().toEqualTypeOf<3>();

    expectTypeOf<Result[0]>().toExtend<CompositeTransformFn<{ rawData: string }, Person>>();
    expectTypeOf<Result[1]>().toExtend<CompositeTransformFn<Person, Address>>();
    expectTypeOf<Result[2]>().toExtend<CompositeTransformFn<Address, CompleteProfile>>();
  });
});
