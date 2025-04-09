import type { type } from "arktype";
import type { MaybePromise } from "node_modules/msw/lib/core/typeUtils";
import type { AdapterContext, ErrorMessage, UnsetMarker } from "../../global-types";
import type { AnyAdapterHandler, InferHandlerOutput } from "../adapter-builder/types";

export type CompositeSourceFn = (ctx: AdapterContext) => MaybePromise<string>;

export type CompositeSource = string | CompositeSourceFn;

export type GetAdapterHandlerFromType<
  TAdapterType extends string,
  TAdapterHandlers extends AnyAdapterHandler[],
> = TAdapterHandlers extends Array<infer THandler>
  ? THandler extends AnyAdapterHandler
    ? THandler["adapterType"] extends TAdapterType
      ? THandler
      : never
    : never
  : never;

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type MergeSources<
  TSources extends Record<string, CompositeSource>,
  TAdapterSources extends AnyAdapterHandler[],
> = Id<{
  [K in keyof TSources]: TSources[K] extends CompositeSource
    ? TSources[K] extends CompositeSourceFn
      ? Awaited<ReturnType<TSources[K]>>
      : TSources[K]
    : never;
} & {
  [K in TAdapterSources[number]["adapterType"]]: GetAdapterHandlerFromType<K, TAdapterSources> extends AnyAdapterHandler
    ? InferHandlerOutput<GetAdapterHandlerFromType<K, TAdapterSources>>
    : never;
}>;

type IsKeyInSources<
  TKey extends string,
  TSources extends Record<string, unknown>,
> = TKey extends keyof TSources
  ? true
  : false;

export type CompositeTransformFn<TSources, TOut> = (
  ctx: AdapterContext,
  sources: TSources,
) => MaybePromise<TOut>;

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: <TSources extends Record<string, CompositeSource>>(
    sources: TParams["_sources"] extends UnsetMarker
      ? (
          TParams["_adapterSources"] extends UnsetMarker
            ? TSources
            : {
                [K in keyof TSources]: K extends string
                  ? IsKeyInSources<K, Record<TParams["_adapterSources"][number]["adapterType"], any>> extends false
                    ? TSources[K]
                    : ErrorMessage<`Key ${K} is already in sources`>
                  : TSources[K];
              }
        )
      : ErrorMessage<"sources is already set">,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TSources;
    _transform: TParams["_transform"];
  }>;

  adapterSources: <TSources extends AnyAdapterHandler[]>(
    sources: TParams["_adapterSources"] extends UnsetMarker
      ? (
          TParams["_sources"] extends UnsetMarker
            ? TSources
            : {
                [K in keyof TSources]: TSources[K] extends AnyAdapterHandler
                  ? IsKeyInSources<TSources[K]["adapterType"], TParams["_sources"]> extends false
                    ? TSources[K]
                    : ErrorMessage<`Key ${TSources[K]["adapterType"]} is already in sources`>
                  : never;
              }
        )
      : ErrorMessage<"adapter sources is already set">
  ) => CompositeHandlerBuilder<{
    _sources: TParams["_sources"];
    _adapterSources: TSources;
    _outputSchema: TParams["_outputSchema"];
    _transform: TParams["_transform"];

  }>;

  transform: <TMergedSources extends MergeSources<TParams["_sources"], TParams["_adapterSources"]>, TOut>(
    fn: CompositeTransformFn<TMergedSources, TOut>
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TParams["_sources"];
    _transform: TOut;
  }>;

  build: () => CompositeHandler<{
    outputSchema: TParams["_outputSchema"];
    sources: TParams["_sources"];
    adapterSources: TParams["_adapterSources"];
    transform: TParams["_transform"];
  }>;
}

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: any;
  _adapterSources: any;
  _transform: any;
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: Record<string, CompositeSource>;
  adapterSources: AnyAdapterHandler[];
  transform: any;
}

export interface CompositeHandler<TParams extends AnyBuiltCompositeHandlerParams> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
  adapterSources: TParams["adapterSources"];
  transform: CompositeTransformFn<MergeSources<TParams["sources"], TParams["adapterSources"]>, TParams["transform"]>;
}

export type AnyCompositeHandler = CompositeHandler<any>;
