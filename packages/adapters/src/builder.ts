import type {
  AdapterContext,
  AdapterHandlerBuilder,
  AdapterHandlerType,
  AnyAdapterHandler,
  AnyHandleVersionParams,
  HandleVersionBuilder,
  NormalizedVersionHandler,
  PredicateFn,
  UnsetMarker,
} from "./types";

function internalCreateAdapterHandlerBuilder<TAdapterType extends AdapterHandlerType>(
  initDef: Partial<AnyAdapterHandler> = {},
): AdapterHandlerBuilder<{
    _type: TAdapterType;
    _handlers: [PredicateFn, NormalizedVersionHandler<AnyHandleVersionParams>][];
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
    _handlers: [PredicateFn, NormalizedVersionHandler<AnyHandleVersionParams>][];
  }> {
  return internalCreateAdapterHandlerBuilder<TAdapterType>({
    adapterType: opts?.type,
  });
}

function internalCreateVersionHandlerBuilder(
  initDef: Partial<NormalizedVersionHandler<any>> = {},
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
  }> {
  const _def: Partial<NormalizedVersionHandler<any>> = {
    ...initDef,
  };

  return {
    urls(urls) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        urls: typeof urls === "function" ? urls : () => urls,
      }) as HandleVersionBuilder<any>;
    },
    parser(parser, options) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        parser,
        parserOptions: options,
      }) as HandleVersionBuilder<any>;
    },
    transform(transform) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        transform,
      }) as HandleVersionBuilder<any>;
    },
    aggregate(aggregate) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        aggregate,
      }) as HandleVersionBuilder<any>;
    },
    output(output) {
      return {
        ..._def,
        output,
      } as NormalizedVersionHandler<any>;
    },
    cacheOptions(cacheOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        cacheOptions,
      }) as HandleVersionBuilder<any>;
    },
    fetchOptions(fetchOptions) {
      return internalCreateVersionHandlerBuilder({
        ..._def,
        fetchOptions,
      }) as HandleVersionBuilder<any>;
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
}> {
  return internalCreateVersionHandlerBuilder();
}

const builder2 = createVersionHandlerBuilder()
  .urls((ctx) => {
    return {
      url: "https://example.com",
      cacheKey: "example",
    };
  })
  .parser((_, data) => {
    return data;
  }).transform((ctx, data) => {
    return data;
  }).aggregate((ctx, data) => {
    return data;
  }).output((ctx, data) => {
    return data;
  });
