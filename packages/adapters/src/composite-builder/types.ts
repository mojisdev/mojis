import type { type } from "arktype";
import type { MaybePromise } from "node_modules/msw/lib/core/typeUtils";
import type { AnyAdapterHandler } from "../adapter-builder/types";
import type { AdapterContext, ErrorMessage, UnsetMarker } from "../global-types";

export type CompositeSourceFn = (ctx: AdapterContext) => MaybePromise<string>;

export type CompositeSource = string | CompositeSourceFn;

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
