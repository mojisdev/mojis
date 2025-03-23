import type {
  WriteCacheOptions,
} from "@mojis/internal-utils";
import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { BUILTIN_PARSERS } from "./utils";

type MaybePromise<T> = T | Promise<T>;
export type MaybeArray<T> = T | T[];

export type JsonValue = string | number | boolean | null | undefined;
export interface JsonObject { [key: string]: JsonValue | JsonObject | JsonArray }
export type JsonArray = (JsonValue | JsonObject)[];
export type Json = JsonValue | JsonObject | JsonArray;

/**
 * The type of the adapter handler.
 */
export type AdapterHandlerType = "metadata";

export type AdapterUrls = MaybeArray<string> | MaybeArray<undefined> | MaybeArray<UrlWithCache>;

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

export type BuiltinParser = typeof BUILTIN_PARSERS[number];

export type ParserFn<
  TContext extends AdapterContext,
  TOutput,
> = (ctx: TContext, data: string) => TOutput;

export type GetParseOptionsFromParser<TParser extends string | ParserFn<AdapterContext, any>> =
  TParser extends string ?
    TParser extends "generic"
      ? GenericParseOptions
      : never
    : never;

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
};

export interface VersionHandler {
  adapterType: AdapterHandlerType;
  versionHandlers: [PredicateFn, HandleVersionBuilder<AnyHandleVersionParams>][];
}

export type AnyVersionHandler = VersionHandler;

export interface AnyHandleVersionParams {
  _urls: any;
  _aggregate: {
    in: any;
    out: any;
  };
  _transform: {
    in: any;
    out: any;
  };
  _parser: any;
  _parserOptions: any;
  _output: any;
}

export type ErrorMessage<TError extends string> = TError;

export type GetParseOutputFromBuiltInParser<TParser extends string> =
  TParser extends "generic" ? GenericParseResult :
    never;

export type TransformFn<
  TContext extends AdapterContext,
  TParseInput,
  TTransformOutput,
> = (ctx: TContext, data: TParseInput) => TTransformOutput;

export interface HandleVersionBuilder<TParams extends AnyHandleVersionParams> {
  urls: <TUrls extends AdapterUrls>(
    urls: TParams["_urls"] extends UnsetMarker
      ? (ctx: AdapterContext) => TUrls
      : ErrorMessage<"urls is already set">,
  ) => HandleVersionBuilder<{
    _urls: TUrls;
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
  }>;
  parser: <TParser extends BuiltinParser | ParserFn<AdapterContext, any>, TParserOptions extends GetParseOptionsFromParser<TParser>>(
    parser: TParams["_parser"] extends UnsetMarker ? TParser : ErrorMessage<"parser is already set">,
    options?: TParserOptions
  ) => HandleVersionBuilder<{
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParser;
    _parserOptions: TParserOptions;
    _output: TParams["_output"];
  }>;
  transform: <TIn extends GetParseOutputFromBuiltInParser<TParams["_parser"]>, TOut>(
    transform: TParams["_transform"]["in"] extends UnsetMarker ? TransformFn<AdapterContext, TIn, TOut> : ErrorMessage<"transform is already set">,
  ) => HandleVersionBuilder<{
    _urls: TParams["_urls"];
    _aggregate: TParams["_aggregate"];
    _transform: TParams["_transform"];
    _parser: TParams["_parser"];
    _parserOptions: TParams["_parserOptions"];
    _output: TParams["_output"];
  }>;
}

export interface AnyAdapterHandlerParams {
  _type: AdapterHandlerType;
  _versionHandlers: [PredicateFn, HandleVersionBuilder<AnyHandleVersionParams>][];
}

export type PredicateFn = (version: string) => boolean;

export interface AdapterHandlerBuilder<TParams extends AnyAdapterHandlerParams> {
  onVersion: <TPredicate extends PredicateFn, TBuilderParams extends AnyHandleVersionParams, TBuilder extends HandleVersionBuilder<TBuilderParams>>(
    predicate: TPredicate,
    builder: (builder: TBuilder) => TBuilder,
  ) => AdapterHandlerBuilder<{
    _type: TParams["_type"];
    _versionHandlers: [
      ...TParams["_versionHandlers"],
      [TPredicate, TBuilder],
    ];
  }>;
}
