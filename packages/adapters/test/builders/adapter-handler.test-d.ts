import type {
  InferHandlerOutput,
} from "../../src/builders/adapter-builder/types";
import type { CreateAdapterVersionHandler, CreateAnyAdapterHandler } from "../__utils";
import { describe, expectTypeOf, it } from "vitest";

describe("InferHandlerOutput", () => {
  it("should infer the output of an adapter handler", () => {
    type Result = InferHandlerOutput<CreateAnyAdapterHandler<"test", {
      handlers: [
        CreateAdapterVersionHandler<{ output: string }>,
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });

  it("should infer the output of an adapter handler with multiple handlers", () => {
    type Result = InferHandlerOutput<CreateAnyAdapterHandler<"test", {
      fallback: () => string;
      handlers: [
        CreateAdapterVersionHandler<{ output: string }>,
      ];
    }>>;

    expectTypeOf<Result>().toEqualTypeOf<string>();
  });
});
