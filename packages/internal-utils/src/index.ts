import { type } from "arktype";

export * from "./cache";
export * from "./constants";
export * from "./hexcode";
export * from "./predicates";
export * from "./shortcodes";
export type * from "./types";
export * from "./versions";

/**
 * Parses the given input against the provided ArkType schema.
 *
 * @template TSchema - The ArkType schema to parse against.
 * @template TInput - The type of the input to parse.
 * @param {TInput} input - The input to parse.
 * @param {TSchema} schema - The ArkType schema to use for parsing.
 * @returns {TSchema["infer"]} - The inferred type from the schema if parsing is successful, otherwise null.
 * @throws {Error} - If the input does not conform to the schema, an error is logged to the console.
 */
export function arktypeParse<TSchema extends type.Any, TInput>(
  input: TInput,
  schema: TSchema,
  // TODO: make this more like the zod safeParse
): TSchema["infer"] {
  const out = schema(input);
  if (out instanceof type.errors) {
    console.error(out.summary);
    return null;
  }
  return out;
}
