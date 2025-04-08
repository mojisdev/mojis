import type { type } from "arktype";
import type { UnsetMarker } from "../global-types";
import type { AnyCompositeHandler, CompositeHandlerBuilder } from "./types";

function internalCreateCompositeHandlerBuilder<TOutputSchema extends type.Any>(
  initDef: Partial<AnyCompositeHandler> = {},
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: UnsetMarker;
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
      }) as CompositeHandlerBuilder<any>;
    },
    build() {
      return _def;
    },
  };
}

export type PredicateFn = (version: string) => boolean;

export interface CreateBuilderOptions<TOutputSchema extends type.Any> {
  outputSchema?: TOutputSchema;
  predicate?: (version: string) => boolean;
}

export function createCompositeHandlerBuilder<TOutputSchema extends type.Any>(
  opts: CreateBuilderOptions<TOutputSchema>,
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: UnsetMarker;
  }> {
  return internalCreateCompositeHandlerBuilder<TOutputSchema>({
    outputSchema: opts.outputSchema,
  });
}
