import type { type } from "arktype";

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: (sources: string[]) => CompositeHandlerBuilder<TParams>;

  build: () => AnyCompositeHandler;
}

export interface AnyCompositeHandlerParams {
  _outputSchema: type.Any;
  _sources: string[];
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: type.Any;
  sources: string[];
}

export interface CompositeHandler<TParams extends AnyBuiltCompositeHandlerParams> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
}

export type AnyCompositeHandler = CompositeHandler<any>;
