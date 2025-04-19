import type { type } from "arktype";
import type {
  AdapterContext,
  ErrorMessage,
  GetSourceAdapterFromType,
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

export interface CompositeHandler<
  TParams extends AnyBuiltCompositeHandlerParams,
> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
  adapterSources: TParams["adapterSources"];
  transforms: TParams["transforms"];
  output: TParams["output"];
}

export type AnyCompositeHandler = CompositeHandler<any>;

export type GetLastTransformOutput<TTransforms extends any[]> = TTransforms extends [
  ...any[],
  infer Last,
]
  ? Last
  : ErrorMessage<"no transforms defined">;

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: <TSources extends Record<string, CompositeSource>>(
    sources: TParams["_sources"] extends UnsetMarker
      ? TParams["_adapterSources"] extends UnsetMarker
        ? TSources
        : {
            [K in keyof TSources]: K extends string
              ? IsKeyInSources<
                K,
                Record<TParams["_adapterSources"][number]["adapterType"], any>
              > extends false
                ? TSources[K]
                : ErrorMessage<`Key ${K} is already in adapter sources`>
              : TSources[K];
          }
      : ErrorMessage<"sources is already set">,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TSources;
    _transforms: TParams["_transforms"];
    _output: TParams["_output"];
  }>;

  adapterSources: <TSources extends AnySourceAdapter[]>(
    sources: TParams["_adapterSources"] extends UnsetMarker
      ? TParams["_sources"] extends UnsetMarker
        ? TSources
        : {
            [K in keyof TSources]: TSources[K] extends AnySourceAdapter
              ? IsKeyInSources<
                TSources[K]["adapterType"],
                TParams["_sources"]
              > extends false
                ? TSources[K]
                : ErrorMessage<`Key ${TSources[K]["adapterType"]} is already in sources`>
              : never;
          }
      : ErrorMessage<"adapter sources is already set">,
  ) => CompositeHandlerBuilder<{
    _sources: TParams["_sources"];
    _adapterSources: TSources;
    _outputSchema: TParams["_outputSchema"];
    _transforms: TParams["_transforms"];
    _output: TParams["_output"];
  }>;

  transform: <
    TIn extends TParams["_transforms"] extends any[]
      ? TParams["_transforms"]["length"] extends 0
        ? MergeSources<TParams["_sources"], TParams["_adapterSources"]>
        : GetLastTransformOutput<TParams["_transforms"]>
      : never,
    TOut,
  >(
    fn: CompositeTransformFn<TIn, TOut>,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TParams["_sources"];
    _transforms: MergeTuple<
      TParams["_transforms"],
      [TOut]
    >;
    _output: TParams["_output"];
  }>;

  output: <
    TIn extends TParams["_transforms"] extends any[]
      ? GetLastTransformOutput<TParams["_transforms"]>
      : never,
    TOut extends TParams["_outputSchema"] extends UnsetMarker
      ? any
      : TParams["_outputSchema"]["infer"],
  >(
    output: TParams["_output"] extends UnsetMarker
      ? (ctx: AdapterContext, data: TIn) => TOut
      : ErrorMessage<"output is already set">
  ) => CompositeHandler<{
    outputSchema: TParams["_outputSchema"];
    sources: TParams["_sources"];
    adapterSources: TParams["_adapterSources"];
    transforms: TransformChain<
      MergeSources<TParams["_sources"], TParams["_adapterSources"]>,
      TParams["_transforms"]
    >;
    output: TOut;
  }>;
}
