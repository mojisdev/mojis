import type {
  AdapterContext,
  UnsetMarker,
} from "../../global-types";
import type { AnySourceTransformer, SourceTransformerBuilder } from "./types";

function internalCreateSourceTransformerBuilder<
  TOutputSchema,
>(
  initDef: Partial<AnySourceTransformer> = {},
): SourceTransformerBuilder<{
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
    _outputSchema: TOutputSchema;
  }> {
  const _def: Partial<AnySourceTransformer> = {
    outputSchema: initDef.outputSchema,
    ...initDef,
  };

  return {
    urls(userUrls) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        urls: userUrls,
      }) as SourceTransformerBuilder<any>;
    },
    parser(userParser, userParserOptions) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        parser: userParser,
        parserOptions: userParserOptions,
      }) as SourceTransformerBuilder<any>;
    },
    transform(userTransform) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        transform: userTransform,
      }) as SourceTransformerBuilder<any>;
    },
    aggregate(userAggregate) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        aggregate: userAggregate,
      }) as SourceTransformerBuilder<any>;
    },
    cacheOptions(userCacheOptions) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        cacheOptions: userCacheOptions,
      }) as SourceTransformerBuilder<any>;
    },
    fetchOptions(userFetchOptions) {
      return internalCreateSourceTransformerBuilder({
        ..._def,
        fetchOptions: userFetchOptions,
      }) as SourceTransformerBuilder<any>;
    },
    output(userOutput) {
      return {
        ..._def,
        output: userOutput,
      } as AnySourceTransformer;
    },
  };
}

export function createSourceTransformerBuilder<TOutputSchema>(): SourceTransformerBuilder<{
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
  _outputSchema: TOutputSchema;
}> {
  return internalCreateSourceTransformerBuilder<TOutputSchema>();
}
