import type { type } from "arktype";
import type { SourceTransformer } from "../source-transformer-builder/define";

export interface SourceAdapter<TOutputSchema extends type.Any> {
  type: string;
  outputSchema: TOutputSchema;
  fallback: TOutputSchema["infer"];
  transformers: Array<SourceTransformer<any, any, any, TOutputSchema["infer"]>>;
}

export function defineSourceAdapter<
  TOutputSchema extends type.Any,
>(handler: SourceAdapter<TOutputSchema>): SourceAdapter<TOutputSchema> {
  return handler;
}
