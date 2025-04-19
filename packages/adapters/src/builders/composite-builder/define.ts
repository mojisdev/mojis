import type { type } from "arktype";
import type { EmptyObject } from "../../global-types";
import type { AnySourceAdapter } from "../source-builder/types";
import type { CompositeHandler, CompositeSource, CompositeTransformFn } from "./types";

export function defineCompositeHandler<
  TOutputSchema extends type.Any,
  const TTransforms extends CompositeTransformFn<any, any>[],
  const TSources extends Record<string, CompositeSource> = EmptyObject,
  const TAdapterSources extends AnySourceAdapter[] = [],
>(handler: CompositeHandler<
  TOutputSchema,
  TTransforms,
  TSources,
  TAdapterSources
>): CompositeHandler<
    TOutputSchema,
    TTransforms,
    TSources,
    TAdapterSources
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
