import type { type } from "arktype";
import type {
  SourceAdapterType,
  UnsetMarker,
} from "../../global-types";
import type { AnySourceTransformer } from "../source-transformer-builder/types";
import type {
  AnySourceAdapter,
  PersistenceContext,
  PredicateFn,
  SourceAdapterBuilder,
} from "./types";
import { createSourceTransformerBuilder } from "../source-transformer-builder/builder";

function internalCreateSourceAdapterBuilder<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
  TPersistence extends PersistenceContext,
>(
  initDef: Partial<AnySourceAdapter> = {},
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _fallback: UnsetMarker;
    _persistence: TPersistence;
    _persistenceMapFn: any;
  }> {
  const _def: AnySourceAdapter = {
    adapterType: initDef.adapterType,
    transformerOutputSchema: initDef.transformerOutputSchema,
    handlers: [],
    fallback: () => {},
    persistence: initDef.persistence ?? {} as PersistenceContext,
    persistenceMapFn: () => { return []; },

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
    toPersistenceOperations(userFn) {
      return internalCreateSourceAdapterBuilder({
        ..._def,
        persistenceMapFn: userFn,
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
  TPersistence extends PersistenceContext,
> {
  type: TAdapterType;
  transformerOutputSchema: TTransformerOutputSchema;
  persistence: TPersistence;
}

export function createSourceAdapter<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
  TPersistence extends PersistenceContext,
>(
  opts: CreateSourceAdapterBuilderOptions<
    TAdapterType,
    TTransformerOutputSchema,
    TPersistence
  >,
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _fallback: UnsetMarker;
    _persistence: TPersistence;
    _persistenceMapFn: any;
  }> {
  return internalCreateSourceAdapterBuilder<TAdapterType, TTransformerOutputSchema, TPersistence>({
    adapterType: opts.type,
    transformerOutputSchema: opts.transformerOutputSchema,
    persistence: opts.persistence,
  });
}
