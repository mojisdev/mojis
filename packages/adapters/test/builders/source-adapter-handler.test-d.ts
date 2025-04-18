import type { type } from "arktype";
import type {
  InferHandlerOutput,
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
