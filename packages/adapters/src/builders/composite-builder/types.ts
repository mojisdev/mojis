import type { type } from "arktype";
import type {
  AdapterContext,
  EmptyObject,
  ErrorMessage,
  GetSourceAdapterFromType,
  HasElements,
  HasKeys,
  Id,
  MaybePromise,
  MergeTuple,
  UnsetMarker,
} from "../../global-types";
import type {
  AnySourceAdapter,
  InferHandlerOutput,
} from "../source-builder/types";

export type PrimitiveSource = string | number | boolean;

export type CompositeSourceFn = (
  ctx: AdapterContext,
) => MaybePromise<PrimitiveSource>;

export type CompositeSource = PrimitiveSource | CompositeSourceFn;

export type GetObjectFromAdapterSources<
  TAdapterSources extends AnySourceAdapter[],
> = Id<{
  [K in TAdapterSources[number]["adapterType"]]: GetSourceAdapterFromType<
    K,
    TAdapterSources
  > extends AnySourceAdapter
    ? InferHandlerOutput<GetSourceAdapterFromType<K, TAdapterSources>>
    : never;
}>;

export type GetObjectFromCompositeSources<
  TSources extends Record<string, CompositeSource>,
> = Id<{
  [K in keyof TSources]: TSources[K] extends CompositeSource
    ? TSources[K] extends CompositeSourceFn
      ? Awaited<ReturnType<TSources[K]>>
      : TSources[K]
    : never;
}>;

export type GetSourcesFromAdapters<
  TAdapterSources extends AnySourceAdapter[] | UnsetMarker,
> = TAdapterSources extends UnsetMarker
  ? never
  : TAdapterSources extends AnySourceAdapter[]
    ? GetObjectFromAdapterSources<TAdapterSources>
    : never;

export type GetSourcesFromComposites<
  TSources extends Record<string, CompositeSource> | UnsetMarker,
> = TSources extends UnsetMarker
  ? never
  : TSources extends Record<string, CompositeSource>
    ? GetObjectFromCompositeSources<TSources>
    : never;

export type MergeCompositeAndAdapterSources<
  TSources extends Record<string, CompositeSource>,
  TAdapterSources extends AnySourceAdapter[],
> = Omit<
  GetObjectFromCompositeSources<TSources>,
  TAdapterSources[number]["adapterType"]
> & GetObjectFromAdapterSources<TAdapterSources>;

export type MergeSources<
  TSources extends Record<string, CompositeSource> | UnsetMarker,
  TAdapterSources extends AnySourceAdapter[] | UnsetMarker,
> = Id<
  TSources extends UnsetMarker
    ? GetSourcesFromAdapters<TAdapterSources>
    : TAdapterSources extends UnsetMarker
      ? GetSourcesFromComposites<TSources>
      : TSources extends Record<string, CompositeSource>
        ? TAdapterSources extends AnySourceAdapter[]
          ? MergeCompositeAndAdapterSources<TSources, TAdapterSources>
          : never
        : never
>;

export type IsKeyInSources<
  TKey extends string,
  TSources extends Record<string, unknown>,
> = TKey extends keyof TSources ? true : false;

export type CompositeTransformFn<TIn, TOut> = (
  ctx: AdapterContext,
  sources: TIn,
) => MaybePromise<TOut>;

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: any;
  _adapterSources: any;
  _transforms: any[];
  _output: any;
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: Record<string, CompositeSource>;
  adapterSources: AnySourceAdapter[];
  transforms: any[];
  output: any;
}

export type TransformChain<
  TInitialSources,
  TTransforms extends any[],
> = TTransforms extends []
  ? []
  : TTransforms extends [infer First, ...infer Rest]
    ? [
        CompositeTransformFn<TInitialSources, First>,
        ...TransformChain<First, Rest>,
      ]
    : never;

export type GetLastTransformOutput<TTransforms extends any[]> = TTransforms extends [
  ...any[],
  infer Last,
]
  ? Last
  : ErrorMessage<"no transforms defined">;

export interface CompositeHandler<
  TOutputSchema extends type.Any,
  TTransforms extends CompositeTransformFn<any, any>[],
  TSources extends Record<string, CompositeSource> = EmptyObject,
  TAdapterSources extends AnySourceAdapter[] = [],
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
  // transforms: TTransforms["length"] extends 0 ? [
  //   CompositeTransformFn<MergeSources<TSources, TAdapterSources>, any>,
  //   ...TTransforms,
  // ] : [
  //   ...TTransforms,
  //   CompositeTransformFn<GetLastTransformOutput<TTransforms>, any>,
  // ];
}
