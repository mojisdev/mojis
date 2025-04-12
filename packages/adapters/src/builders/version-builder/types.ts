import type { CacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { type } from "arktype";
import type { AdapterContext, BuiltinParser, ErrorMessage, PossibleUrls, UnsetMarker } from "../../global-types";

export type UrlFn<TOut extends PossibleUrls> = (ctx: AdapterContext) => TOut;

export type ParserFn<TContext extends AdapterContext, TOutput> = (
  ctx: TContext,
  data: string,
) => TOutput;

export type GetParseOptionsFromParser<TParser extends string> =
  TParser extends "generic" ? GenericParseOptions : never;

export type GetParseOutputFromBuiltInParser<TParser extends BuiltinParser> =
  TParser extends "generic" ? GenericParseResult : never;

export type InferParseOutput<
  TContext extends AdapterContext,
  TParser,
> = TParser extends BuiltinParser
  ? GetParseOutputFromBuiltInParser<TParser>
  : TParser extends ParserFn<TContext, infer TOutput>
    ? TOutput
    : never;

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

  // schema for output validation
  _outputSchema: any;
}

export type TransformFn<TContext extends AdapterContext, TIn, TOut> = (
  ctx: TContext,
  data: TIn,
) => TOut;

export type AggregateFn<TContext extends AdapterContext, TIn, TOut> = (
  ctx: TContext,
  data: TIn[],
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
    _outputSchema: TParams["_outputSchema"];
  }>;

  parser: <TParser extends BuiltinParser | ParserFn<AdapterContext, any>>(
    parser: TParams["_parser"]["parser"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"parser is already set">,
    options?: TParser extends BuiltinParser
      ?
      | GetParseOptionsFromParser<TParser>
      | WrapInContextFn<
        AdapterContext,
        { key: string },
        GetParseOptionsFromParser<TParser>
      >
      : never,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _outputSchema: TParams["_outputSchema"];
    _transform: TParams["_transform"];
    _options: TParams["_options"];
    _parser: {
      parser: TParser;
      out: TParser extends ParserFn<AdapterContext, infer TOut>
        ? TOut
        : TParser extends BuiltinParser
          ? GetParseOutputFromBuiltInParser<TParser>
          : never;
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
    _outputSchema: TParams["_outputSchema"];
    _options: TParams["_options"];
    _transform: {
      in: TIn;
      out: TOut;
    };
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];

    // if there are multiple urls, we set it to an array,
    // because we don't know if aggregate is there or not
    _outputType: TParams["_urls"] extends any[] ? TOut[] : TOut;
  }>;

  aggregate: <TIn extends TParams["_transform"]["out"], TOut>(
    aggregate: TParams["_aggregate"]["in"] extends UnsetMarker
      ? AggregateFn<AdapterContext, TIn, TOut>
      : ErrorMessage<"aggregate is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _outputSchema: TParams["_outputSchema"];
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

  cacheOptions: <
    TOptions extends CacheOptions,
  >(
    cacheOptions: TParams["_options"]["cacheOptions"] extends UnsetMarker
      ? TOptions
      : ErrorMessage<"cacheOptions is already set">,
  ) => HandleVersionBuilder<{
    _context: TParams["_context"];
    _outputSchema: TParams["_outputSchema"];
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
    _outputSchema: TParams["_outputSchema"];
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

  output: <TIn extends TParams["_outputType"], TOut extends TParams["_outputSchema"] extends UnsetMarker ? any : TParams["_outputSchema"]>(
    output: TParams["_output"] extends UnsetMarker
      ? OutputFn<AdapterContext, TIn, TOut>
      : ErrorMessage<"output is already set">,
  ) => VersionHandler<{
    globalContext: TParams["_context"];
    cacheOptions: TParams["_options"]["cacheOptions"];
    fetchOptions: TParams["_options"]["fetchOptions"];
    parserOptions: TParams["_parserOptions"];
    parser: TParams["_parser"]["parser"];
    parserOutput: TParams["_parser"]["out"];
    urls: TParams["_urls"];
    transform: TParams["_transform"]["out"];
    aggregate: TParams["_aggregate"]["out"];
    outputSchema: TParams["_outputSchema"];
    output: TOut;
  }>;
}

export interface AnyBuiltVersionHandlerParams {
  globalContext: AdapterContext;
  fetchOptions: RequestInit;
  cacheOptions: CacheOptions;
  parser: any;
  parserOptions: GetParseOptionsFromParser<any>;
  parserOutput: any;
  outputSchema: type.Any;
  urls: PossibleUrls;
  transform: any;
  aggregate: any;
  output: any;
}

export interface VersionHandler<TParams extends AnyBuiltVersionHandlerParams> {
  globalContext: TParams["globalContext"];
  fetchOptions: TParams["fetchOptions"];
  cacheOptions: TParams["cacheOptions"];
  parser: TParams["parser"];
  parserOptions: TParams["parserOptions"];
  urls: UrlFn<TParams["urls"]>;
  transform: TransformFn<TParams["globalContext"], TParams["parserOutput"], TParams["transform"]>;
  aggregate: AggregateFn<TParams["globalContext"], TParams["transform"], TParams["aggregate"]>;
  output: TParams["output"];
  outputSchema: TParams["outputSchema"];
}

export type AnyVersionHandler = VersionHandler<any>;
