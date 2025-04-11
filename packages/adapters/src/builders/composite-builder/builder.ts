import type { type } from "arktype";
import type { UnsetMarker } from "../../global-types";
import type { AnyCompositeHandler, CompositeHandlerBuilder } from "./types";

function internalCreateCompositeHandlerBuilder<TOutputSchema extends type.Any>(
  initDef: Partial<AnyCompositeHandler> = {},
): CompositeHandlerBuilder<{
    _outputSchema: TOutputSchema;
    _sources: UnsetMarker;
    _adapterSources: UnsetMarker;
    _transform: [];
  }> {
  const _def: AnyCompositeHandler = {
    outputSchema: initDef.outputSchema,
    sources: initDef.sources ?? [],
    adapterSources: initDef.adapterSources ?? [],
    transform: initDef.transform ?? [],
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
        transform: [..._def.transform, async (ctx, sources) => {
          const result = await userTransform(ctx, sources);
          if (_def.outputSchema) {
            const validationResult = _def.outputSchema(result);
            if (!validationResult.data) {
              throw new Error(`Invalid transform output: ${validationResult.problems.join(", ")}`);
            }
            return validationResult.data;
          }
          return result;
        }],
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
    _transform: [];
  }> {
  return internalCreateCompositeHandlerBuilder<TOutputSchema>({
    outputSchema: opts.outputSchema,
  });
}
