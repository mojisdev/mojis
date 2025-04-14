import type { type } from "arktype";
import type {
  SourceAdapterType,
  UnsetMarker,
} from "../../global-types";
import type { AnySourceTransformer } from "../source-transformer-builder/types";
import type {
  AnySourceAdapter,
  FallbackFn,
  PredicateFn,
  SourceAdapterBuilder,
} from "./types";
import { createSourceTransformerBuilder } from "../source-transformer-builder/builder";

function internalCreateSourceAdapterBuilder<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
  TPersistenceOutputSchema extends type.Any,
>(
  initDef: Partial<AnySourceAdapter> = {},
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _persistenceOutputSchema: TPersistenceOutputSchema;
    _fallback: UnsetMarker;
    _persistence: UnsetMarker;
    _persistenceOptions: UnsetMarker;
  }> {
  const _def: AnySourceAdapter = {
    adapterType: initDef.adapterType,
    transformerOutputSchema: initDef.transformerOutputSchema,
    handlers: [],
    fallback: () => {},

    // overload with properties passed in
    ...initDef,
  };

  return {
    withTransform(userPredicate, userBuilder) {
      const sourceTransformer = userBuilder(
        createSourceTransformerBuilder<TTransformerOutputSchema["infer"]>() as any,
      );
      return internalCreateSourceAdapterBuilder({
        ..._def,
        handlers: [
          ..._def.handlers,
          [userPredicate, sourceTransformer],
        ],
      }) as SourceAdapterBuilder<any>;
    },
    fallback(userFn) {
      return internalCreateSourceAdapterBuilder({
        ..._def,
        fallback: userFn,
      }) as SourceAdapterBuilder<any>;
    },
    persistence(userFn) {
      return internalCreateSourceAdapterBuilder({
        ..._def,
        persistence: userFn,
      }) as SourceAdapterBuilder<any>;
    },
    persistenceOptions(userOptions) {
      return internalCreateSourceAdapterBuilder({
        ..._def,
        persistenceOptions: userOptions,
      }) as SourceAdapterBuilder<any>;
    },
    build() {
      return _def;
    },
  };
}

export interface CreateSourceAdapterBuilderOptions<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
  TPersistenceOutputSchema extends type.Any,
> {
  type: TAdapterType;
  transformerOutputSchema?: TTransformerOutputSchema;
  persistenceOutputSchema?: TPersistenceOutputSchema;
}

export function createSourceAdapter<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
  TPersistenceOutputSchema extends type.Any,
>(
  opts: CreateSourceAdapterBuilderOptions<
    TAdapterType,
    TTransformerOutputSchema,
    TPersistenceOutputSchema
  >,
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _persistenceOutputSchema: TPersistenceOutputSchema;
    _fallback: UnsetMarker;
    _persistence: UnsetMarker;
    _persistenceOptions: UnsetMarker;
  }> {
  return internalCreateSourceAdapterBuilder<TAdapterType, TTransformerOutputSchema, TPersistenceOutputSchema>({
    adapterType: opts.type,
    transformerOutputSchema: opts.transformerOutputSchema,
  });
}
