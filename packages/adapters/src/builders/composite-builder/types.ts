import type { type } from "arktype";
import type { MaybePromise } from "node_modules/msw/lib/core/typeUtils";
import type {
  AdapterContext,
  ErrorMessage,
  GetAdapterHandlerFromType,
  Id,
  UnsetMarker,
} from "../../global-types";
import type {
  AnyAdapterHandler,
  InferHandlerOutput,
} from "../adapter-builder/types";

export type PrimitiveSource = string | number | boolean;

export type CompositeSourceFn = (
  ctx: AdapterContext,
) => MaybePromise<PrimitiveSource>;

export type CompositeSource = PrimitiveSource | CompositeSourceFn;

export type GetObjectFromAdapterSources<
  TAdapterSources extends AnyAdapterHandler[],
> = Id<{
  [K in TAdapterSources[number]["adapterType"]]: GetAdapterHandlerFromType<
    K,
    TAdapterSources
  > extends AnyAdapterHandler
    ? InferHandlerOutput<GetAdapterHandlerFromType<K, TAdapterSources>>
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

export type MergeSources<
  TSources extends Record<string, CompositeSource> | UnsetMarker,
  TAdapterSources extends AnyAdapterHandler[] | UnsetMarker,
> = Id<
  TSources extends UnsetMarker
    ? TAdapterSources extends UnsetMarker
      ? never
      : TAdapterSources extends AnyAdapterHandler[]
        ? GetObjectFromAdapterSources<TAdapterSources>
        : never
    : TAdapterSources extends UnsetMarker
      ? TSources extends Record<string, CompositeSource>
        ? GetObjectFromCompositeSources<TSources>
        : never
      : TSources extends Record<string, CompositeSource>
        ? TAdapterSources extends AnyAdapterHandler[]
          ? Omit<
            GetObjectFromCompositeSources<TSources>,
            TAdapterSources[number]["adapterType"]
          > &
          GetObjectFromAdapterSources<TAdapterSources>
          : never
        : never
>;

type IsKeyInSources<
  TKey extends string,
  TSources extends Record<string, unknown>,
> = TKey extends keyof TSources ? true : false;

export type CompositeTransformFn<TSources, TOut> = (
  ctx: AdapterContext,
  sources: TSources,
) => MaybePromise<TOut>;

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: any;
  _adapterSources: any;
  _transforms: any[];
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: Record<string, CompositeSource>;
  adapterSources: AnyAdapterHandler[];
  transforms: any[];
}

export interface CompositeHandler<
  TParams extends AnyBuiltCompositeHandlerParams,
> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
  adapterSources: TParams["adapterSources"];
  transforms: TParams["transforms"];
  // transform: CompositeTransformFn<MergeSources<TParams["sources"], TParams["adapterSources"]>, TParams["transform"][number]>[];
}

export type AnyCompositeHandler = CompositeHandler<any>;

export type GetLastTransformOutput<TTransforms extends any[]> = TTransforms extends [
  ...any[],
  infer Last,
]
  ? Last
  : never;

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
                : ErrorMessage<`Key ${K} is already in sources`>
              : TSources[K];
          }
      : ErrorMessage<"sources is already set">,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TSources;
    _transforms: TParams["_transforms"];
  }>;

  adapterSources: <TSources extends AnyAdapterHandler[]>(
    sources: TParams["_adapterSources"] extends UnsetMarker
      ? TParams["_sources"] extends UnsetMarker
        ? TSources
        : {
            [K in keyof TSources]: TSources[K] extends AnyAdapterHandler
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
  }>;

  transform: <
    TIn extends TParams["_transforms"] extends any[]
      ? TParams["_transforms"]["length"] extends 0
        ? MergeSources<TParams["_sources"], TParams["_adapterSources"]>
        : GetLastTransformOutput<TParams["_transforms"]>
      : never,
    TOut extends TParams["_transforms"] extends any[]
      ? TParams["_transforms"]["length"] extends 0
        ? any
        : TParams["_outputSchema"] extends type.Any
          ? TParams["_outputSchema"]["infer"]
          : never
      : never,
  >(
    fn: CompositeTransformFn<TIn, TOut>,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TParams["_sources"];
    _transforms: [...TParams["_transforms"], TOut];
  }>;

  build: () => CompositeHandler<{
    outputSchema: TParams["_outputSchema"];
    sources: TParams["_sources"];
    adapterSources: TParams["_adapterSources"];
    transforms: TParams["_transforms"];
  }>;
}
