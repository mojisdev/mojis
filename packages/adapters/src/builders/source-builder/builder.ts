import type { type } from "arktype";
import type {
  SourceAdapterType,
} from "../../global-types";
import type { AnySourceTransformer } from "../version-builder/types";
import type {
  AnySourceAdapter,
  FallbackFn,
  PredicateFn,
  SourceAdapterBuilder,
} from "./types";
import { createSourceTransformerBuilder } from "../version-builder/builder";

function internalCreateSourceAdapterBuilder<TAdapterType extends SourceAdapterType, TOutputSchema extends type.Any>(
  initDef: Partial<AnySourceAdapter> = {},
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _outputSchema: TOutputSchema;
    _fallback: FallbackFn<TOutputSchema["infer"]>;
  }> {
  const _def: AnySourceAdapter = {
    adapterType: initDef.adapterType,
    outputSchema: initDef.outputSchema,
    handlers: [],
    fallback: () => {},

    // overload with properties passed in
    ...initDef,
  };

  return {
    withTransform(userPredicate, userBuilder) {
      const sourceTransformer = userBuilder(createSourceTransformerBuilder<TOutputSchema["infer"]>() as any);
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

export interface CreateBuilderOptions<TAdapterType extends SourceAdapterType, TOutputSchema extends type.Any> {
  type: TAdapterType;
  outputSchema?: TOutputSchema;
}

export function createSourceAdapter<TAdapterType extends SourceAdapterType, TOutputSchema extends type.Any>(
  opts: CreateBuilderOptions<TAdapterType, TOutputSchema>,
): SourceAdapterBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnySourceTransformer][];
    _outputSchema: TOutputSchema;
  }> {
  return internalCreateSourceAdapterBuilder<TAdapterType, TOutputSchema>({
    adapterType: opts.type,
    outputSchema: opts.outputSchema,
  });
}
