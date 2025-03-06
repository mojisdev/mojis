import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiVariation,
  WriteCacheOptions,
} from "@mojis/internal-utils";

type Promisable<T> = T | Promise<T>;
type Arrayable<T> = T | T[];

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

export type v2_AdapterHandlerType = "emojis" | "shortcodes" | "sequences" | "variations" | "metadata";

export type UrlBuilder = (ctx: AdapterContext) => Promisable<Arrayable<string> | Arrayable<undefined> | Arrayable<v2_UrlWithCache>>;

export type v2_ShouldExecute<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
> = (ctx: TContext & TExtraContext) => Promisable<boolean>;

export interface v2_UrlWithCache {
  /**
   * The url to fetch the data.
   */
  url: string;

  /**
   * The cache key for the data.
   */
  cacheKey: string;
}

export type v2_TransformFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TParseInput,
  TTransformOutput,
> = (ctx: TContext & TExtraContext, data: TParseInput) => TTransformOutput;

export type v2_AggregateFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TTransformOutput,
  TAggregateOutput,
> = (ctx: TContext & TExtraContext, data: [TTransformOutput, ...TTransformOutput[]]) => TAggregateOutput;

export type v2_OutputFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TTransformOutput,
  TOutput,
> = (ctx: TContext & TExtraContext, data: TTransformOutput) => TOutput;

// TODO: find a better name for the splitter parser
// The splitter parser is just a simple parser, that will split the data based on a separater character.
export type BuiltinParser = "splitter";

export type v2_ParserFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
  TOutput,
> = (ctx: TContext & TExtraContext, data: string) => TOutput;

export type v2_GetParseOutputFromBuiltInParser<TParser extends BuiltinParser> =
  TParser extends "splitter" ? string[] :
    never;

export type v2_GetParseOptionsFromParser<TParser extends BuiltinParser> =
  TParser extends "splitter" ? { separator: string } :
    never;

export interface v2_AdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
  TBuiltinParser extends BuiltinParser = BuiltinParser,
  TParseOutput = v2_GetParseOutputFromBuiltInParser<TBuiltinParser>,
> {
  /**
   * The type of the handler, this is used to identify the handler.
   */
  type: TType;

  /**
   * The urls that will be fetched.
   */
  urls: Arrayable<string> | Arrayable<undefined> | Arrayable<v2_UrlWithCache> | UrlBuilder;

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
  shouldExecute?: v2_ShouldExecute<TContext, TExtraContext>;

  /**
   * A list of other "handlers types", that is required to be run before this handler.
   */
  dependencies?: string[];

  /**
   * A parse function or a reference to a builtin parser.
   *
   */
  parser: v2_ParserFn<TContext, TExtraContext, TParseOutput> | TBuiltinParser;

  /**
   * Options that will be passed to the parser.
   * This will only be used if the parser is a builtin parser.
   */
  parserOptions?: v2_GetParseOptionsFromParser<TBuiltinParser>;

  /**
   * A transform function that will run for each of the urls.
   * It will pass the returned type downwards to either the aggregate function or the output.
   */
  transform: v2_TransformFn<TContext, TExtraContext, TParseOutput, TTransformOutput>;

  /**
   * An aggregate function that will run if defined.
   * It will receive all the transformed results as parameters, which it can then aggregate the results into a final output.
   */
  aggregate?: v2_AggregateFn<TContext, TExtraContext, TTransformOutput, TAggregateOutput>;

  /**
   * Output function which will receive the transformed result from the transform function, or from the aggregate function.
   * It will then output the result.
   */
  output: v2_OutputFn<TContext, TExtraContext, TAggregateOutput extends TTransformOutput ? TTransformOutput : TAggregateOutput, TOutput>;
}
