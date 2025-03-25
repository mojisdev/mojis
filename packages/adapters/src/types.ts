import type { WriteCacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { BUILTIN_PARSERS } from "./utils";

/**
 * A type that can be an array or a single value.
 */
export type MaybeArray<T> = T | T[];

/**
 * The type of the adapter handler.
 */
export type AdapterHandlerType =
  | "metadata"
  | "variations"
  | "unicode-names"
  | "sequences";

export interface AdapterContext {
  /**
   * The emoji version.
   */
  emoji_version: string;

  /**
   * The unicode version.
   * This will correspond to the emoji version.
   */
  unicode_version: string;

  /**
   * Whether or not the force mode was enabled.
   */
  force: boolean;
}

export interface UrlWithCache {
  /**
   * The url to fetch the data.
   */
  url: string;

  /**
   * The cache key for the data.
   */
  cacheKey: string;

  /**
   * The key to identify the data.
   *
   * NOTE:
   * If not set it will be generated from the cache key.
   */
  key?: string;
}

export type PossibleUrls = MaybeArray<UrlWithCache> | MaybeArray<string> | MaybeArray<undefined>;

export type UrlFn<TOut extends PossibleUrls> = (ctx: AdapterContext) => TOut;

export type BuiltinParser = (typeof BUILTIN_PARSERS)[number];

export type ParserFn<TContext extends AdapterContext, TOutput> = (
  ctx: TContext,
  data: string,
) => TOutput;

export type GetParseOptionsFromParser<TParser extends string> =
  TParser extends "generic" ? GenericParseOptions : never;

export type GetParseOutputFromBuiltInParser<TParser extends BuiltinParser> =
  TParser extends "generic" ? GenericParseResult : never;

export type InferParseOutput<TContext extends AdapterContext, TParser> =
  TParser extends BuiltinParser
    ? GetParseOutputFromBuiltInParser<TParser>
    : TParser extends ParserFn<TContext, infer TOutput>
      ? TOutput
      : never;

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
};

export interface AnyHandleVersionParams {
  _context: AdapterContext;
  _urls: any;
  _aggregate: {
    in: any;
    out: any;
  };
  _transform: {
    in: any;
    out: any;
  };
  _parser: {
    parser: any;
    out: any;
  };
  _options: {
    cacheOptions: any;
    fetchOptions: any;
  };
  _parserOptions: any;
  _output: any;
  // used to infer the output type based on if
  // the handler is using aggregate or not
  _outputType: any;
}

export type ErrorMessage<TError extends string> = TError;

export type TransformFn<TContext extends AdapterContext, TIn, TOut> = (
  ctx: TContext,
  data: TIn,
) => TOut;

export type AggregateFn<TContext extends AdapterContext, TIn, TOut> = (
  ctx: TContext,
  data: [TIn, ...TIn[]],
) => TOut;

export type OutputFn<TContext extends AdapterContext, TIn, TOut> = (
  ctx: TContext,
  data: TIn,
) => TOut;

export type WrapInContextFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TReturn,
> = (ctx: TContext & TExtraContext) => TReturn;

export type WrapContextFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TReturn,
> = ((ctx: TContext & TExtraContext) => TReturn) | TReturn;

export interface NormalizedVersionHandler<
  TParams extends AnyHandleVersionParams,
> {
  urls: (ctx: AdapterContext) => TParams["_urls"];
  parser: TParams["_parser"]["parser"];
  parserOptions: TParams["_parserOptions"];
  transform: (
    ctx: AdapterContext,
    data: TParams["_parser"]["out"],
  ) => TParams["_transform"]["out"];
  aggregate: (
    ctx: AdapterContext,
    data: TParams["_transform"]["out"],
  ) => TParams["_aggregate"]["out"];
  output: (
    ctx: AdapterContext,
    data: TParams["_outputType"],
  ) => TParams["_output"];
  cacheOptions: TParams["_options"]["cacheOptions"];
  fetchOptions: TParams["_options"]["fetchOptions"];
}

export interface HandleVersionBuilder<TParams extends AnyHandleVersionParams> {
  urls: <TUrls extends PossibleUrls>(
    urls: TParams["_urls"] extends UnsetMarker
      ? UrlFn<TUrls>
      : ErrorMessage<"urls is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TUrls;
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
    _options: TParams["_options"];
    _outputType: TParams["_outputType"];
  }>;

  parser: <TParser extends BuiltinParser | ParserFn<AdapterContext, any>>(
    parser: TParams["_parser"]["parser"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"parser is already set">,
    options?: TParser extends BuiltinParser
      ?
      | GetParseOptionsFromParser<TParser>
      | WrapInContextFn<AdapterContext, { key: string }, GetParseOptionsFromParser<TParser>>
      : never,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _options: TParams["_options"];
    _parser: {
      parser: TParser;
      out: TParser extends ParserFn<AdapterContext, infer TOut> ? TOut : TParser extends BuiltinParser ? GetParseOutputFromBuiltInParser<TParser> : never;
    };
    _parserOptions: TParser extends BuiltinParser
      ? GetParseOptionsFromParser<TParser>
      : undefined;
    _output: TParams["_output"];
    _outputType: TParams["_outputType"];
  }>;

  transform: <TIn extends TParams["_parser"]["out"], TOut>(
    transform: TParams["_transform"]["in"] extends UnsetMarker
      ? TransformFn<AdapterContext, TIn, TOut>
      : ErrorMessage<"transform is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _options: TParams["_options"];
    _transform: {
      in: TIn;
      out: TOut;
    };
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
    _outputType: TOut;
  }>;

  aggregate: <TIn extends TParams["_transform"]["out"], TOut>(
    aggregate: TParams["_aggregate"]["in"] extends UnsetMarker
      ? AggregateFn<AdapterContext, TIn, TOut>
      : ErrorMessage<"aggregate is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _aggregate: {
      in: TIn;
      out: TOut;
    };
    _transform: TParams["_transform"];
    _options: TParams["_options"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _urls: TParams["_urls"];
    _output: TParams["_output"];
    _outputType: TOut;
  }>;

  cacheOptions: <TOptions extends Omit<WriteCacheOptions<unknown>, "transform">>(
    cacheOptions: TParams["_options"]["cacheOptions"] extends UnsetMarker
      ? TOptions
      : ErrorMessage<"cacheOptions is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
    _options: {
      cacheOptions: TOptions;
      fetchOptions: TParams["_options"]["fetchOptions"];
    };
    _outputType: TParams["_outputType"];
  }>;

  fetchOptions: <TOptions extends RequestInit>(
    fetchOptions: TParams["_options"]["fetchOptions"] extends UnsetMarker
      ? TOptions
      : ErrorMessage<"fetchOptions is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
    _options: {
      cacheOptions: TParams["_options"]["cacheOptions"];
      fetchOptions: TOptions;
    };
    _outputType: TParams["_outputType"];
  }>;

  output: <TIn extends TParams["_outputType"], TOut>(
    output: TParams["_output"] extends UnsetMarker
      ? OutputFn<AdapterContext, TIn, TOut>
      : ErrorMessage<"output is already set">,
  ) => NormalizedVersionHandler<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _options: TParams["_options"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TOut;
    _outputType: TParams["_outputType"];
  }>;
}

export interface AnyAdapterHandlerParams {
  _type: AdapterHandlerType;
  _handlers: [
    PredicateFn,
    NormalizedVersionHandler<AnyHandleVersionParams>,
  ][];
}

export type PredicateFn = (version: string) => boolean;

export interface AdapterHandlerBuilder<
  TParams extends AnyAdapterHandlerParams,
> {
  onVersion: <
    TPredicate extends PredicateFn,
    TBuilderParams extends AnyHandleVersionParams,
    TBuilder extends HandleVersionBuilder<TBuilderParams>,
  >(
    predicate: TPredicate,
    builder: (
      builder: TBuilder,
    ) => NormalizedVersionHandler<AnyHandleVersionParams>,
  ) => AdapterHandlerBuilder<{
    _type: TParams["_type"];
    _handlers: [
      ...TParams["_handlers"],
      [TPredicate, NormalizedVersionHandler<AnyHandleVersionParams>],
    ];
  }>;
  build: () => AdapterHandler<{
    type: TParams["_type"];
    handlers: TParams["_handlers"];
  }>;
}

export interface AnyBuiltAdapterHandlerParams {
  type: AdapterHandlerType;
  handlers: [PredicateFn, NormalizedVersionHandler<AnyHandleVersionParams>][];
}

export interface AdapterHandler<TParams extends AnyBuiltAdapterHandlerParams> {
  adapterType: TParams["type"];
  handlers: TParams["handlers"];
}

export type AnyAdapterHandler = AdapterHandler<any>;

export interface AnyBuiltVersionHandlerParams {
  globalContext: AdapterContext;
  fetchOptions: RequestInit;
  cacheOptions: Omit<WriteCacheOptions<unknown>, "transform">;
  urls: PossibleUrls;
}

export interface VersionHandler<TParams extends AnyBuiltVersionHandlerParams> {
  globalContext: TParams["globalContext"];
}
