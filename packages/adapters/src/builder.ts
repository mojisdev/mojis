import type {
  AdapterContext,
  AdapterHandlerBuilder,
  AdapterHandlerType,
  AnyAdapterHandler,
  AnyVersionHandler,
  HandleVersionBuilder,
  PredicateFn,
  UnsetMarker,
} from "./types";

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

function internalCreateVersionHandlerBuilder(
  initDef: Partial<AnyVersionHandler> = {},
): HandleVersionBuilder<{
    _context: AdapterContext;
    _urls: UnsetMarker;
    _aggregate: {
      in: UnsetMarker;
      out: UnsetMarker;
    };
    _options: {
      cacheOptions: UnsetMarker;
      fetchOptions: UnsetMarker;
    };
    _output: UnsetMarker;
    _outputType: UnsetMarker;
    _parser: {
      parser: UnsetMarker;
      out: UnsetMarker;
    };
    _parserOptions: UnsetMarker;
    _transform: {
      in: UnsetMarker;
      out: UnsetMarker;
    };
    _validation: UnsetMarker;
  }> {
  const _def: Partial<AnyVersionHandler> = {
    ...initDef,
  };

  return {
    urls(userUrls) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        urls: userUrls,
      }) as HandleVersionBuilder<any>;
    },
    parser(userParser, userParserOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        parser: userParser,
        parserOptions: userParserOptions,
      }) as HandleVersionBuilder<any>;
    },
    transform(userTransform) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        transform: userTransform,
      }) as HandleVersionBuilder<any>;
    },
    aggregate(userAggregate) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        aggregate: userAggregate,
      }) as HandleVersionBuilder<any>;
    },
    cacheOptions(userCacheOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        cacheOptions: userCacheOptions,
      }) as HandleVersionBuilder<any>;
    },
    fetchOptions(userFetchOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        fetchOptions: userFetchOptions,
      }) as HandleVersionBuilder<any>;
    },
    validation(userValidation) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        validation: userValidation,
      }) as HandleVersionBuilder<any>;
    },
    output(userOutput) {
      return {
        ..._def,
        output: userOutput,
      } as AnyVersionHandler;
    },
  };
}

export function createVersionHandlerBuilder(): HandleVersionBuilder<{
  _aggregate: {
    in: UnsetMarker;
    out: UnsetMarker;
  };
  _context: AdapterContext;
  _urls: UnsetMarker;
  _output: UnsetMarker;
  _options: {
    cacheOptions: UnsetMarker;
    fetchOptions: UnsetMarker;
  };
  _outputType: UnsetMarker;
  _parser: {
    parser: UnsetMarker;
    out: UnsetMarker;
  };
  _parserOptions: UnsetMarker;
  _transform: {
    in: UnsetMarker;
    out: UnsetMarker;
  };
  _validation: UnsetMarker;
}> {
  return internalCreateVersionHandlerBuilder();
}
