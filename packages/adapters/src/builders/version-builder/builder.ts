import type {
  AdapterContext,
  UnsetMarker,
} from "../../global-types";
import type { AnyVersionedSourceTransformer, VersionedSourceTransformerBuilder } from "./types";

function internalCreateVersionedSourceTransformerBuilder<
  TOutputSchema,
>(
  initDef: Partial<AnyVersionedSourceTransformer> = {},
): VersionedSourceTransformerBuilder<{
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
  const _def: Partial<AnyVersionedSourceTransformer> = {
    outputSchema: initDef.outputSchema,
    ...initDef,
  };

  return {
    urls(userUrls) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        urls: userUrls,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    parser(userParser, userParserOptions) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        parser: userParser,
        parserOptions: userParserOptions,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    transform(userTransform) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        transform: userTransform,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    aggregate(userAggregate) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        aggregate: userAggregate,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    cacheOptions(userCacheOptions) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        cacheOptions: userCacheOptions,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    fetchOptions(userFetchOptions) {
      return internalCreateVersionedSourceTransformerBuilder({
        ..._def,
        fetchOptions: userFetchOptions,
      }) as VersionedSourceTransformerBuilder<any>;
    },
    output(userOutput) {
      return {
        ..._def,
        output: userOutput,
      } as AnyVersionedSourceTransformer;
    },
  };
}

export function createVersionedSourceTransformerBuilder<TOutputSchema>(): VersionedSourceTransformerBuilder<{
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
  return internalCreateVersionedSourceTransformerBuilder<TOutputSchema>();
}
