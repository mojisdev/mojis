import type { type } from "arktype";
import type { ErrorMessage } from "../../global-types";
import type { AnySourceAdapter } from "../source-builder/types";
import type { CompositeSource, IsKeyInSources } from "./types";
import { metadataHandler } from "../../handlers/source";

// Helper type to check if an array type has elements
type HasElements<T extends any[]> = T extends readonly [any, ...any[]] ? true : false;
type HasKeys<T extends Record<string, any>> = keyof T extends never ? false : true;

interface CompositeHandler<
  _TOutputSchema extends type.Any,
  TSources extends Record<string, CompositeSource>,
  TAdapterSources extends AnySourceAdapter[],
  TTransforms extends any[],
  TOutput,
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

  transforms?: TTransforms;
  output?: TOutput;
}

export function defineCompositeHandler<
  TOutputSchema extends type.Any,
  const TSources extends Record<string, CompositeSource>,
  const TAdapterSources extends AnySourceAdapter[],
  TTransforms extends any[],
  TOutput,
>(handler: CompositeHandler<
  TOutputSchema,
  TSources,
  TAdapterSources,
  TTransforms,
  TOutput
>): CompositeHandler<
    TOutputSchema,
    TSources,
    TAdapterSources,
    TTransforms,
    TOutput
  > {
  return handler;
}

// defineCompositeHandler({
//   sources: {
//     key: "aldj",
//   },
//   adapterSources: [
//     metadataHandler,
//   ],
//   transforms: [

//   ],
// });

// defineCompositeHandler({
//   sources: {
//     key: "aldj",
//   },
//   adapterSources: [
//     metadataHandler,
//   ],
//   transforms: chain([
//     () => {

//     },

//   ]),
// });
