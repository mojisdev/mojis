import type {
  InferHandlerOutput,
} from "../../src/builders/source-builder/types";
import type { CreateAnySourceAdapter, CreateSourceTransformer } from "../__utils";
import { describe, expectTypeOf, it } from "vitest";

describe("InferHandlerOutput", () => {
  it("should infer the output of an adapter handler", () => {
    type Result = InferHandlerOutput<CreateAnySourceAdapter<"test", {
      handlers: [
        CreateSourceTransformer<{ output: string }>,
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });

  it("should infer the output of an adapter handler with multiple handlers", () => {
    type Result = InferHandlerOutput<CreateAnySourceAdapter<"test", {
      fallback: () => string;
      handlers: [
        CreateSourceTransformer<{ output: string }>,
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });
});
