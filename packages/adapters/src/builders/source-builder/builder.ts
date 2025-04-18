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
>(
  initDef: Partial<AnySourceAdapter> = {},
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _fallback: UnsetMarker;
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
    build() {
      return _def;
    },
  };
}

export interface CreateSourceAdapterBuilderOptions<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
> {
  type: TAdapterType;
  transformerOutputSchema: TTransformerOutputSchema;
  persistence: PersistenceContext;
}

export function createSourceAdapter<
  TAdapterType extends SourceAdapterType,
  TTransformerOutputSchema extends type.Any,
>(
  opts: CreateSourceAdapterBuilderOptions<
    TAdapterType,
    TTransformerOutputSchema
  >,
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _transformerOutputSchema: TTransformerOutputSchema;
    _fallback: UnsetMarker;
  }> {
  return internalCreateSourceAdapterBuilder<TAdapterType, TTransformerOutputSchema>({
    adapterType: opts.type,
    transformerOutputSchema: opts.transformerOutputSchema,
  });
}
