import type {
  WriteCacheOptions,
} from "@mojis/internal-utils";
import type { ParseResult } from "@mojis/parsers";
import type { BUILTIN_PARSERS } from "./utils";

type Promisable<T> = T | Promise<T>;
export type Arrayable<T> = T | T[];

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

export type AdapterHandlerType = "metadata" | "sequence";

export type UrlBuilder = (ctx: AdapterContext) => Promisable<Arrayable<string> | Arrayable<undefined> | Arrayable<UrlWithCache>>;

export type ShouldExecute<
  TContext extends AdapterContext,
> = (ctx: TContext) => Promisable<boolean>;

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

export type TransformFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TParseInput,
  TTransformOutput,
> = (ctx: TContext & TExtraContext, data: TParseInput) => TTransformOutput;

export type AggregateFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TTransformOutput,
  TAggregateOutput,
> = (ctx: TContext & TExtraContext, data: [TTransformOutput, ...TTransformOutput[]]) => TAggregateOutput;

export type OutputFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TTransformOutput,
  TOutput,
> = (ctx: TContext & TExtraContext, data: TTransformOutput) => TOutput;

export type BuiltinParser = typeof BUILTIN_PARSERS[number];

export type ParserFn<
  TContext extends AdapterContext,
  TOutput,
> = (ctx: TContext, data: string) => TOutput;

export type GetParseOutputFromBuiltInParser<TParser extends string> =
  TParser extends "generic" ? ParseResult :
    never;

export type GetParseOptionsFromParser<TParser extends string> =
  TParser extends "generic" ? { separator: string } :
    never;

export interface AdapterHandler<
  TType extends AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
  TBuiltinParser extends BuiltinParser = BuiltinParser,
  TParseOutput = GetParseOutputFromBuiltInParser<TBuiltinParser>,
> {
  /**
   * The type of the handler, this is used to identify the handler.
   */
  type: TType;

  /**
   * The urls that will be fetched.
   */
  urls: Arrayable<string> | Arrayable<undefined> | Arrayable<UrlWithCache> | UrlBuilder;

  /**
   * Options that will be passed to the fetch function.
   */
  fetchOptions?: RequestInit;

  /**
   * Options that will be passed to the cache function.
   */
  cacheOptions?: Omit<WriteCacheOptions<unknown>, "transform">;

  /**
   * Whether or not that this handler should handle the request.
   */
  shouldExecute: ShouldExecute<TContext>;

  /**
   * A list of other "handlers types", that is required to be run before this handler.
   */
  dependencies?: string[];

  /**
   * A parse function or a reference to a builtin parser.
   *
   */
  parser: ParserFn<TContext, TParseOutput> | TBuiltinParser;

  /**
   * Options that will be passed to the parser.
   * This will only be used if the parser is a builtin parser.
   */
  parserOptions?: GetParseOptionsFromParser<TBuiltinParser>;

  /**
   * A transform function that will run for each of the urls.
   * It will pass the returned type downwards to either the aggregate function or the output.
   */
  transform: TransformFn<TContext, TExtraContext, TParseOutput, TTransformOutput>;

  /**
   * An aggregate function that will run if defined.
   * It will receive all the transformed results as parameters, which it can then aggregate the results into a final output.
   */
  aggregate?: AggregateFn<TContext, TExtraContext, TTransformOutput, TAggregateOutput>;

  /**
   * Output function which will receive the transformed result from the transform function, or from the aggregate function.
   * It will then output the result.
   */
  output: OutputFn<TContext, TExtraContext, TAggregateOutput extends TTransformOutput ? TTransformOutput : TAggregateOutput, TOutput>;
}
