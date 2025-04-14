import type {
  InferHandlerOutput,
} from "../../src/builders/source-builder/types";
import type { CreateAnySourceAdapter, CreateVersionedSourceTransformer } from "../__utils";
import { describe, expectTypeOf, it } from "vitest";

describe("InferHandlerOutput", () => {
  it("should infer the output of an adapter handler", () => {
    type Result = InferHandlerOutput<CreateAnySourceAdapter<
      // @ts-expect-error `test` is not a valid adapter type
      "test",
      {
        handlers: [
          CreateVersionedSourceTransformer<{ output: string }>,
        ];
      }
    >>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });

  it("should infer the output of an adapter handler with multiple handlers", () => {
    type Result = InferHandlerOutput<CreateAnySourceAdapter<
      // @ts-expect-error `test` is not a valid adapter type
      "test",
      {
        handlers: [
          CreateVersionedSourceTransformer<{ output: string }>,
        ];
        fallback: () => string;
      }
    >>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });
});
