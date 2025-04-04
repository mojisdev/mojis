import type { z } from "zod";
import type {
  AdapterHandlerType,
} from "../global-types";
import type { AnyVersionHandler } from "../version-builder/types";
import type {
  AdapterHandlerBuilder,
  AnyAdapterHandler,
  FallbackFn,
  PredicateFn,
} from "./types";
import { createVersionHandlerBuilder } from "../version-builder/builder";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType, TOutputSchema extends z.ZodType>(
  initDef: Partial<AnyAdapterHandler> = {},
): AdapterHandlerBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnyVersionHandler][];
    _outputSchema: TOutputSchema;
    _fallback: FallbackFn<TOutputSchema["_input"]>;
  }> {
  const _def: AnyAdapterHandler = {
    adapterType: initDef.adapterType,
    outputSchema: initDef.outputSchema,
    handlers: [],
    fallback: () => {},

    // overload with properties passed in
    ...initDef,
  };

  return {
    onVersion(userPredicate, userBuilder) {
      const versionHandler = userBuilder(createVersionHandlerBuilder<TOutputSchema["_input"]>() as any);
      return internalCreateAdapterHandlerBuilder({
        ..._def,
        handlers: [
          ..._def.handlers,
          [userPredicate, versionHandler],
        ],
      }) as AdapterHandlerBuilder<any>;
    },
    fallback(userFn) {
      return internalCreateAdapterHandlerBuilder({
        ..._def,
        fallback: userFn,
      }) as AdapterHandlerBuilder<any>;
    },
    build() {
      return _def;
    },
  };
}

export interface CreateBuilderOptions<TAdapterType extends AdapterHandlerType, TOutputSchema extends z.ZodType> {
  type: TAdapterType;
  outputSchema?: TOutputSchema;
}

export function createAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType, TOutputSchema extends z.ZodType>(
  opts: CreateBuilderOptions<TAdapterType, TOutputSchema>,
): AdapterHandlerBuilder<{
    _adapterType: TAdapterType;
    _handlers: [PredicateFn, AnyVersionHandler][];
    _outputSchema: TOutputSchema;
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType, TOutputSchema>({
    adapterType: opts.type,
    outputSchema: opts.outputSchema,
  });
}
