import type { type } from "arktype";
import type { MaybePromise } from "node_modules/msw/lib/core/typeUtils";
import type { AnyAdapterHandler, InferHandlerOutput } from "../adapter-builder/types";
import type { AdapterContext, ErrorMessage, UnsetMarker } from "../global-types";

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

export type CompositeTransformFn<TParams extends AnyCompositeHandlerParams> = (
  ctx: AdapterContext,
  sources: MergeSources<TParams["_sources"], TParams["_adapterSources"]>,
) => MaybePromise<any>;

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: <TSources extends Record<string, CompositeSource>>(
    sources: TParams["_sources"] extends UnsetMarker
      ? TSources
      : ErrorMessage<"sources is already set">,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TSources;
  }>;

  adapterSources: <TSources extends AnyAdapterHandler[]>(
    sources: TParams["_adapterSources"] extends UnsetMarker
      ? TSources
      : ErrorMessage<"adapter sources is already set">
  ) => CompositeHandlerBuilder<{
    _sources: TParams["_sources"];
    _adapterSources: TSources;
    _outputSchema: TParams["_outputSchema"];
  }>;

  transform: (
    fn: CompositeTransformFn<TParams>
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _adapterSources: TParams["_adapterSources"];
    _sources: TParams["_sources"];
  }>;

  build: () => CompositeHandler<{
    outputSchema: TParams["_outputSchema"];
    sources: TParams["_sources"];
    adapterSources: TParams["_adapterSources"];
  }>;
}

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: any;
  _adapterSources: any;
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: string[];
  adapterSources: AnyAdapterHandler[];
}

export interface CompositeHandler<TParams extends AnyBuiltCompositeHandlerParams> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
  adapterSources: TParams["adapterSources"];
}

export type AnyCompositeHandler = CompositeHandler<any>;
