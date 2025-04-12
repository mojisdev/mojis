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
    _output: UnsetMarker;
  }> {
  const _def: AnyCompositeHandler = {
    outputSchema: initDef.outputSchema,
    sources: initDef.sources ?? [],
    adapterSources: initDef.adapterSources ?? [],
    transforms: initDef.transforms ?? [],
    output: initDef.output,
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
    output(userOutput) {
      return {
        ..._def,
        output: userOutput,
      } as AnyCompositeHandler;
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
    _output: UnsetMarker;
  }> {
  return internalCreateCompositeHandlerBuilder<TOutputSchema>({
    outputSchema: opts.outputSchema,
  });
}
