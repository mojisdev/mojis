import type {
  AdapterHandlerBuilder,
  AdapterHandlerType,
  AnyAdapterHandler,
  AnyVersionHandler,
  PredicateFn,
} from "./types";
import { createVersionHandlerBuilder } from "./version-builder";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  initDef: Partial<AnyAdapterHandler> = {},
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _handlers: [PredicateFn, AnyVersionHandler][];
  }> {
  const _def: AnyAdapterHandler = {
    adapterType: initDef.adapterType,
    handlers: [],
    // Overload with properties passed in
    ...initDef,
  };

  return {
    onVersion(predicate, builder) {
      const versionHandler = builder(createVersionHandlerBuilder() as any);
      return internalCreateAdapterHandlerBuilder({
        ..._def,
        handlers: [
          ..._def.handlers,
          [predicate, versionHandler],
        ],
      }) as AdapterHandlerBuilder<any>;
    },
    build() {
      return _def;
    },
  };
}

export interface CreateBuilderOptions<TAdapterType extends AdapterHandlerType> {
  type: TAdapterType;
}

export function createAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  opts?: CreateBuilderOptions<TAdapterType>,
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _handlers: [PredicateFn, AnyVersionHandler][];
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType>({
    adapterType: opts?.type,
  });
}
