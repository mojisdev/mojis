import type { type } from "arktype";
import type { AnySourceAdapter } from "../source-builder/types";
import type { CompositeHandler, CompositeSource, CompositeTransformFn } from "./types";

export function defineCompositeHandler<
  TOutputSchema extends type.Any,
  // eslint-disable-next-line ts/no-empty-object-type
  const TSources extends Record<string, CompositeSource> = {},
  const TAdapterSources extends AnySourceAdapter[] = [],
  TTransforms extends CompositeTransformFn<any, any>[] = [],
>(handler: CompositeHandler<
  TOutputSchema,
  TSources,
  TAdapterSources,
  TTransforms
>): CompositeHandler<
    TOutputSchema,
    TSources,
    TAdapterSources,
    TTransforms
  > {
  return handler;
}

export function chain(
  transforms: CompositeTransformFn<any, any>[],
): CompositeTransformFn<any, any>[] {
  return transforms;
}

export function defineCompositeTransformer<TInput>(
  fn: CompositeTransformFn<TInput, any>,
): CompositeTransformFn<TInput, any> {
  return fn;
}
