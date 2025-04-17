import type { type } from "arktype";
import type {
  InferHandlerOutput,
  PathParamsToRecord,
  PredicateFn,
} from "../../src/builders/source-builder/types";
import type {
  CreateSourceAdapter,
  CreateSourceTransformer,
} from "../__utils";
import { describe, expectTypeOf, it } from "vitest";

describe("InferHandlerOutput", () => {
  it("should infer the output of an adapter handler", () => {
    type Result = InferHandlerOutput<CreateSourceAdapter<"metadata", {
      transformerOutputSchema: type.Any;
      handlers: [
        [
          PredicateFn,
          CreateSourceTransformer<{
            output: string;
          }>,
        ],
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });

  it("should infer the output of an adapter handler with multiple handlers", () => {
    type Result = InferHandlerOutput<CreateSourceAdapter<"metadata", {
      fallback: () => string;
      handlers: [
        [
          PredicateFn,
          CreateSourceTransformer<{ output: string }>,
        ],
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });
});

describe("PathToParameters", () => {
  it("should infer the parameters from a path", () => {
    type Result = PathParamsToRecord<"<base-path>/metadata/{group}.json">;

    expectTypeOf<Result>().toEqualTypeOf<{
      group: string;
    }>();
  });

  it("should infer the parameters from a path with multiple parameters", () => {
    type Result = PathParamsToRecord<"<base-path>/metadata/{group}/{emoji}.json">;

    expectTypeOf<Result>().toEqualTypeOf<{
      group: string;
      emoji: string;
    }>();
  });

  it("should return empty object when no parameters", () => {
    type Result = PathParamsToRecord<"<base-path>/metadata.json">;

    // eslint-disable-next-line ts/no-empty-object-type
    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });
});
