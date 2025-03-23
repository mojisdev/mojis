import type {
  AdapterHandlerBuilder,
  AdapterHandlerType,
  AnyAdapterHandler,
  NormalizedVersionHandler,
  PredicateFn,
} from "./types";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  initDef: Partial<AnyAdapterHandler> = {},
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _versionHandlers: [PredicateFn, NormalizedVersionHandler<any, any>][];
  }> {
  const _def: AnyAdapterHandler = {
    adapterType: initDef.adapterType as AdapterHandlerType,
    versionHandlers: [],
    // Overload with properties passed in
    ...initDef,
  };

  return {
    onVersion(userPredicate, userBuilder) {
      return internalCreateAdapterHandlerBuilder({
        ..._def,
        versionHandlers: [
          ..._def.versionHandlers,
          [userPredicate, userBuilder as unknown as NormalizedVersionHandler<any, any>],
        ],
      });
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
    _versionHandlers: [PredicateFn, NormalizedVersionHandler<any, any>][];
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType>({
    adapterType: opts?.type,
  });
};
