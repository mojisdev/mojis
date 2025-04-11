import type { type } from "arktype";
import type { UnsetMarker } from "../../global-types";
import type { AnyCompositeHandler, CompositeHandlerBuilder } from "./types";

function internalCreateCompositeHandlerBuilder<TOutputSchema extends type.Any>(
  initDef: Partial<AnyCompositeHandler> = {},
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: UnsetMarker;
    _adapterSources: UnsetMarker;
    _transforms: [];
  }> {
  const _def: AnyCompositeHandler = {
    outputSchema: initDef.outputSchema,
    sources: initDef.sources ?? [],
    adapterSources: initDef.adapterSources ?? [],
    transforms: [],
  };

  return {
    sources(userSources) {
      return internalCreateCompositeHandlerBuilder({
        ..._def,
        sources: userSources,
      }) as CompositeHandlerBuilder<any>;
    },
    adapterSources(userAdapterSources) {
      return internalCreateCompositeHandlerBuilder({
        ..._def,
        adapterSources: userAdapterSources,
      }) as CompositeHandlerBuilder<any>;
    },
    transform(userTransform) {
      return internalCreateCompositeHandlerBuilder({
        ..._def,
        transforms: [
          ..._def.transforms,
          userTransform,
        ],
      }) as CompositeHandlerBuilder<any>;
    },
    build() {
      return _def;
    },
  };
}

export interface CreateBuilderOptions<TOutputSchema extends type.Any> {
  outputSchema?: TOutputSchema;
}

export function createCompositeHandlerBuilder<TOutputSchema extends type.Any>(
  opts: CreateBuilderOptions<TOutputSchema>,
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: UnsetMarker;
    _adapterSources: UnsetMarker;
    _transforms: [];
  }> {
  return internalCreateCompositeHandlerBuilder<TOutputSchema>({
    outputSchema: opts.outputSchema,
  });
}
