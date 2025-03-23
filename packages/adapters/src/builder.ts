import type { AdapterHandlerBuilder, AdapterHandlerType, AnyHandleVersionParams, AnyVersionHandler, HandleVersionBuilder, Json, UnsetMarker } from "./types";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  initDef: Partial<AnyVersionHandler> = {},
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _versionHandlers: HandleVersionBuilder<AnyHandleVersionParams>[];
  }> {
  const _def: AnyVersionHandler = {
    adapterType: initDef.adapterType as AdapterHandlerType,
    // versionHandlers: [],
    // Overload with properties passed in
    ...initDef,
  };

  return {
    onVersion(userPredicate, userBuilder) {
      return internalCreateAdapterHandlerBuilder({
        ..._def,
        // versionHandlers: [
        //   ...(_def.versionHandlers || []),
        //   [userPredicate, userBuilder],
        // ],
      });
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
    _versionHandlers: any[];
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType>({
    adapterType: opts?.type,
  });
};

const a = createAdapterHandlerBuilder({
  type: "metadata",
}).onVersion(() => true, (builder) => {
  //                         ^?
  return builder;
});
