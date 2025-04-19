import type { ErrorMessage, HasElements, HasKeys } from "../../global-types";
import type { AnySourceAdapter } from "../source-builder/types";
import type { CompositeSource, CompositeTransformFn, IsKeyInSources } from "./types";
import { type } from "arktype";
import * as handlers from "../../handlers/source";

interface CompositeHandler<
  TOutputSchema extends type.Any,
  // eslint-disable-next-line ts/no-empty-object-type
  TSources extends Record<string, CompositeSource> = {},
  TAdapterSources extends AnySourceAdapter[] = [],
  TTransforms extends CompositeTransformFn<any, any>[] = [],
> {
  sources?: TAdapterSources extends AnySourceAdapter[]
    ? HasElements<TAdapterSources> extends true
      ? {
          [K in keyof TSources]: K extends string
            ? IsKeyInSources<
              K,
              Record<TAdapterSources[number]["adapterType"], any>
            > extends false
              ? TSources[K]
              : ErrorMessage<`Key ${K} is already in adapter sources`>
            : TSources[K];
        }
      : TSources
    : TSources;
  adapterSources?: TSources extends Record<string, CompositeSource>
    ? HasKeys<TSources> extends true
      ? {
          [K in keyof TAdapterSources]: TAdapterSources[K] extends AnySourceAdapter
            ? IsKeyInSources<
              TAdapterSources[K]["adapterType"],
              TSources
            > extends false
              ? TAdapterSources[K]
              : ErrorMessage<`Key ${TAdapterSources[K]["adapterType"]} is already in sources`>
            : TAdapterSources[K];
        }
      : TAdapterSources
    : TAdapterSources;

  outputSchema: TOutputSchema;

  transforms: TTransforms;
}

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

export function chain<T>(
  transforms: CompositeTransformFn<any, any>[],
): CompositeTransformFn<any, any>[] {
  return transforms;
}

export function defineCompositeTransformer<TInput>(
  fn: CompositeTransformFn<TInput, any>,
): CompositeTransformFn<TInput, any> {
  return fn;
}

export const emojiCompositor = defineCompositeHandler({
  outputSchema: type({
    hello: "string",
  }),
  adapterSources: [
    handlers.metadataHandler,
    handlers.sequencesHandler,
    handlers.unicodeNamesHandler,
  ],
  transforms: chain([
    defineCompositeTransformer((ctx, sources) => {
      //                               ^?
      console.error("ctx", ctx);
      console.error("sources", sources);

      return {
        value2: "test2",
      };
    }),
    defineCompositeTransformer((_, sources) => {
      //                            ^?
      return {
        hello: "world",
        version: sources.value2,
      };
    }),
  ]),
});
