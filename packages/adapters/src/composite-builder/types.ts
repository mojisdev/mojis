import type { type } from "arktype";
import type { AnyAdapterHandler } from "../adapter-builder/types";
import type { ErrorMessage, UnsetMarker } from "../global-types";

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: <TSources extends AnyAdapterHandler[]>(
    sources: TParams["_sources"] extends UnsetMarker
      ? TSources
      : ErrorMessage<"sources is already set">,
  ) => CompositeHandlerBuilder<{
    _outputSchema: TParams["_outputSchema"];
    _sources: TSources;
  }>;

  build: () => CompositeHandler<{
    outputSchema: TParams["_outputSchema"];
    sources: TParams["_sources"];
  }>;
}

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: any;
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: AnyAdapterHandler[];
}

export interface CompositeHandler<TParams extends AnyBuiltCompositeHandlerParams> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
}

export type AnyCompositeHandler = CompositeHandler<any>;
