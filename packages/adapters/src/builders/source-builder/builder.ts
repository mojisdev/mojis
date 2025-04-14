import type { type } from "arktype";
import type {
  SourceAdapterType,
} from "../../global-types";
import type { AnyVersionedSourceTransformer } from "../version-builder/types";
import type {
  AnySourceAdapter,
  FallbackFn,
  PersistenceFn,
  PredicateFn,
  SourceAdapterBuilder,
} from "./types";
import { createVersionedSourceTransformerBuilder } from "../version-builder/builder";

function internalCreateSourceAdapterBuilder<
  TAdapterType extends SourceAdapterType,
  TTransformerSchema extends type.Any,
  TOutputSchema extends type.Any,
>(
  initDef: Partial<AnySourceAdapter> = {},
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnyVersionedSourceTransformer][];
    _outputSchema: TOutputSchema;
    _transformerSchema: TTransformerSchema;
    _fallback: FallbackFn<TOutputSchema["infer"]>;
    _persistence: PersistenceFn<TTransformerSchema["infer"], TOutputSchema["infer"]>;
  }> {
  const _def: AnySourceAdapter = {
    adapterType: initDef.adapterType,
    outputSchema: initDef.outputSchema,
    transformerSchema: initDef.transformerSchema,
    handlers: [],
    fallback: () => {},

    // overload with properties passed in
    ...initDef,
  };

  return {
    onVersion(userPredicate, userBuilder) {
      const sourceTransformer = userBuilder(createVersionedSourceTransformerBuilder<TOutputSchema["infer"]>() as any);
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
    build() {
      return _def;
    },
  };
}

export interface CreateBuilderOptions<
  TAdapterType extends SourceAdapterType,
  TTransformerSchema extends type.Any,
  TOutputSchema extends type.Any,
> {
  type: TAdapterType;
  outputSchema: TOutputSchema;
  transformerSchema: TTransformerSchema;
}

export function createSourceAdapter<
  TAdapterType extends SourceAdapterType,
  TTransformerSchema extends type.Any,
  TOutputSchema extends type.Any,
>(
  opts: CreateBuilderOptions<
    TAdapterType,
    TTransformerSchema,
    TOutputSchema
  >,
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnyVersionedSourceTransformer][];
    _transformerSchema: TTransformerSchema;
    _outputSchema: TOutputSchema;
    _fallback: FallbackFn<
      TTransformerSchema["infer"]
    >;
    _persistence: PersistenceFn<
      TTransformerSchema["infer"],
      TOutputSchema["infer"]
    >;
  }> {
  return internalCreateSourceAdapterBuilder<TAdapterType, TTransformerSchema, TOutputSchema>({
    adapterType: opts.type,
    outputSchema: opts.outputSchema,
  });
}
