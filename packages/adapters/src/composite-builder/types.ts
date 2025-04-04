import type { z } from "zod";

export interface CompositeHandlerBuilder<
  TParams extends AnyCompositeHandlerParams,
> {
  sources: (sources: string[]) => CompositeHandlerBuilder<TParams>;

  build: () => AnyCompositeHandler;
}

export interface AnyCompositeHandlerParams {
  _outputSchema: z.ZodType;
  _sources: string[];
}

export interface AnyBuiltCompositeHandlerParams {
  outputSchema: z.ZodType;
  sources: string[];
}

export interface CompositeHandler<TParams extends AnyBuiltCompositeHandlerParams> {
  outputSchema: TParams["outputSchema"];
  sources: TParams["sources"];
}

export type AnyCompositeHandler = CompositeHandler<any>;
