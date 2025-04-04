import type { z } from "zod";
import type { AnyCompositeHandler, CompositeHandlerBuilder } from "./types";

function internalCreateCompositeHandlerBuilder<TOutputSchema extends z.ZodType>(
  initDef: Partial<AnyCompositeHandler> = {},
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: string[];
  }> {
  const _def: AnyCompositeHandler = {
    outputSchema: initDef.outputSchema,
    sources: [],
    // overload with properties passed in
    ...initDef,
  };

  return {
    sources(userSources) {
      return internalCreateCompositeHandlerBuilder({
        ..._def,
        sources: userSources,
      });
    },
    build() {
      return _def;
    },
  };
}

export interface CreateBuilderOptions<TOutputSchema extends z.ZodType> {
  outputSchema?: TOutputSchema;
}

export function createCompositeHandlerBuilder<TOutputSchema extends z.ZodType>(
  opts: CreateBuilderOptions<TOutputSchema>,
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: string[];
  }> {
  return internalCreateCompositeHandlerBuilder<TOutputSchema>({
    outputSchema: opts.outputSchema,
  });
}
