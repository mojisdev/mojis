import type {
  EmojiGroup,
  EmojiMetadata,
  WriteCacheOptions,
} from "@mojis/internal-utils";
import type { GenericParseOptions, GenericParseResult } from "@mojis/parsers";
import type { METADATA_HANDLERS, SEQUENCE_HANDLERS, VARIATION_HANDLERS } from "./handlers";
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

export type AdapterHandlerType = "metadata" | "sequence" | "variation";

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
  TParseInput,
  TTransformOutput,
> = (ctx: TContext, data: TParseInput) => TTransformOutput;

export type AggregateFn<
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput,
> = (ctx: TContext, data: [TTransformOutput, ...TTransformOutput[]]) => TAggregateOutput;

export type OutputFn<
  TContext extends AdapterContext,
  TTransformOutput,
  TOutput,
> = (ctx: TContext, data: TTransformOutput) => TOutput;

export type BuiltinParser = typeof BUILTIN_PARSERS[number];

export type ParserFn<
  TContext extends AdapterContext,
  TOutput,
> = (ctx: TContext, data: string) => TOutput;

export type GetParseOutputFromBuiltInParser<TParser extends string> =
  TParser extends "generic" ? GenericParseResult :
    never;

export type GetParseOptionsFromParser<TParser extends string> =
  TParser extends "generic" ? GenericParseOptions :
    never;

export interface AdapterHandler<
  TType extends AdapterHandlerType,
  TContext extends AdapterContext,
  TParser extends string | ParserFn<TContext, any>,
  TTransformOutput,
  TParseOutput = InferParseOutput<TContext, TParser>,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
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
   * A parse function or a reference to a builtin parser.
   *
   */
  parser: TParser;

  /**
   * Options that will be passed to the parser.
   * This will only be used if the parser is a builtin parser.
   */
  parserOptions?: TParser extends BuiltinParser ? GetParseOptionsFromParser<TParser> : never;

  /**
   * A transform function that will run for each of the urls.
   * It will pass the returned type downwards to either the aggregate function or the output.
   */
  transform: TransformFn<TContext & {
    key: string;
  }, TParseOutput, TTransformOutput>;

  /**
   * An aggregate function that will run if defined.
   * It will receive all the transformed results as parameters, which it can then aggregate the results into a final output.
   */
  aggregate?: AggregateFn<TContext, TTransformOutput, TAggregateOutput>;

  /**
   * Output function which will receive the transformed result from the transform function, or from the aggregate function.
   * It will then output the result.
   */
  output: OutputFn<TContext, TAggregateOutput extends TTransformOutput ? TTransformOutput : TAggregateOutput, TOutput>;
}

export type InferOutputFromAdapterHandlerType<THandlerType extends AdapterHandlerType> =
   THandlerType extends "metadata" ? ReturnType<typeof METADATA_HANDLERS[number]["output"]> :
     THandlerType extends "sequence" ? ReturnType<typeof SEQUENCE_HANDLERS[number]["output"]> :
       THandlerType extends "variation" ? ReturnType<typeof VARIATION_HANDLERS[number]["output"]> :
         unknown;

export type InferParseOutput<TContext extends AdapterContext, TParser extends string | ParserFn<TContext, any>> =
  TParser extends ParserFn<AdapterContext, infer TOutput> ? TOutput :
    TParser extends BuiltinParser ? GetParseOutputFromBuiltInParser<TParser> :
      never;
