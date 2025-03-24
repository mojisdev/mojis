import type { WriteCacheOptions } from "@mojis/internal-utils";
import type {
  AdapterContext,
  AdapterHandlerBuilder,
  AdapterHandlerType,
  AdapterUrls,
  AggregateFn,
  AnyAdapterHandler,
  AnyHandleVersionParams,
  BuiltinParser,
  GetParseOptionsFromParser,
  GetParseOutputFromBuiltInParser,
  HandleVersionBuilder,
  NormalizedVersionHandler,
  OutputFn,
  ParserFn,
  PredicateFn,
  TransformFn,
  UnsetMarker,
  WrapInContextFn,
} from "./types";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  initDef: Partial<AnyAdapterHandler> = {},
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _versionHandlers: [PredicateFn, NormalizedVersionHandler<AnyHandleVersionParams>][];
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
          [userPredicate, userBuilder as unknown as NormalizedVersionHandler<AnyHandleVersionParams>],
        ],
      });
    },
    build() {
      return _def;
    },
  };
}

function internalCreateVersionHandlerBuilder<TParams extends AnyHandleVersionParams>(
  initDef: Partial<NormalizedVersionHandler<TParams>> = {},
): HandleVersionBuilder<TParams> {
  const _def: NormalizedVersionHandler<TParams> = {
    urls: () => undefined,
    parser: "generic",
    parserOptions: undefined,
    transform: (_, data) => data,
    aggregate: (_, data) => data,
    output: (_, data) => data,
    cacheOptions: {},
    fetchOptions: {},
    ...initDef,
  };

  return {
    urls(userUrls) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        urls: userUrls,
      });
    },
    parser(userParser) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        parser: userParser,
      });
    },
    transform(userTransform) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        transform: userTransform,
      });
    },
    aggregate(userAggregate) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        aggregate: userAggregate,
      });
    },
    output(userOutput) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        output: userOutput,
      });
    },
    cacheOptions(userCacheOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        cacheOptions: userCacheOptions,
      });
    },
    fetchOptions(userFetchOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        fetchOptions: userFetchOptions,
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
    _versionHandlers: [PredicateFn, NormalizedVersionHandler<AnyHandleVersionParams>][];
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType>({
    adapterType: opts?.type,
  });
}

export function createVersionHandlerBuilder<TParams extends AnyHandleVersionParams>(
  initDef: Partial<NormalizedVersionHandler<TParams>> = {},
): HandleVersionBuilder<TParams> {
  return internalCreateVersionHandlerBuilder<TParams>(initDef);
}
