import { type } from "arktype";

export * from "./cache";
export * from "./constants";
export * from "./hexcode";
export * from "./predicates";
export * from "./shortcodes";
export type * from "./types";

interface ArkTypeResultError {
  success: false;
  errors: string[];
  data: null;
}

interface ArkTypeResultSuccess<TValue> {
  success: true;
  errors: null;
  data: TValue;
}

export type ArkTypeParseResult<TValue> = ArkTypeResultError | ArkTypeResultSuccess<TValue>;

export function arktypeParse<TSchema extends type.Any>(
  input: unknown,
  schema: TSchema,
): ArkTypeParseResult<TSchema["infer"]> {
  const out = schema(input);
  if (out instanceof type.errors) {
    console.error(out.summary);
    return {
      success: false,
      errors: [out.summary],
      data: null,
    };
  }

  return {
    success: true,
    errors: null,
    data: out,
  };
}
