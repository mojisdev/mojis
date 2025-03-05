import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiVariation,
  WriteCacheOptions,
} from "@mojis/internal-utils";

type Promisable<T> = T | Promise<T>;

export interface MojiAdapter<
  TMetadataUrlReturn extends CacheableUrlRequestReturnType,
  TSequencesUrlReturn extends CacheableUrlRequestReturnType,
  TVariationsUrlReturn extends CacheableUrlRequestReturnType,
> {
  /**
   * The name of the adapter.
   */
  name: string;

  /**
   * A description of the adapter.
   */
  description: string;

  /**
   * A valid semver range for the emoji version this adapter supports.
   */
  range: string;

  /**
   * The name of the adapter to extend from.
   */
  extend?: string;

  /**
   * The metadata handler for the adapter.
   */
  metadata?: AdapterHandler<
    TMetadataUrlReturn,
    ExtraContext<TMetadataUrlReturn>,
    {
      groups: EmojiGroup[];
      emojis: Record<string, Record<string, EmojiMetadata>>;
    },
    any
  >;

  /**
   * The sequences handler for the adapter.
   */
  sequences?: AdapterHandler<
    TSequencesUrlReturn,
    ExtraContext<TSequencesUrlReturn>,
    EmojiSequence[],
    any
  >;

  /**
   * The variations handler for the adapter.
   */
  variations?: AdapterHandler<
    TVariationsUrlReturn,
    ExtraContext<TVariationsUrlReturn>,
    EmojiVariation[],
    any
  >;
}

type ExtraContext<T> = {
  key: string;
} & (T extends CacheableUrlRequest
  ? T["extraContext"] extends Record<string, unknown>
    ? T["extraContext"]
    : Record<string, never>
  : Record<string, never>);

export interface CacheableUrlRequest {
  /**
   * The key for the data.
   * If not provided, a key will be generated based on the url.
   */
  key?: string;

  /**
   * The url to fetch the data
   * @example "https://example.com/data.json"
   */
  url: string;

  /**
   * The cache key for the data.
   * If not provided, a key will be generated based on the url.
   */
  cacheKey?: string;

  /**
   * Extra data to be passed to the handler.
   * @default {}
   */
  extraContext?: Record<string, unknown>;

  /**
   * The fetch options for the request.
   * @default {}
   *
   * NOTE:
   * This will be merged together with the `fetchOptions` of the handler.
   */
  fetchOptions?: RequestInit;

  /**
   * The cache options for the data.
   * @default {}
   *
   * NOTE:
   * This will be merged together with the `cacheOptions` of the handler.
   */
  cacheOptions?: Omit<WriteCacheOptions<any>, "transform">;
}

export type CacheableUrlRequestReturnType = CacheableUrlRequest | CacheableUrlRequest[] | undefined;

export type ExtractDataTypeFromUrls<T extends CacheableUrlRequestReturnType> =
  T extends undefined ? undefined :
    T extends CacheableUrlRequest ? string :
      T extends CacheableUrlRequest[] ? string :
        never;

export interface AdapterHandler<
  TUrlsReturn extends CacheableUrlRequestReturnType,
  TExtraContext extends Record<string, unknown>,
  TTransformOutput,
  TOutput = TTransformOutput,
> {
  urls: (ctx: AdapterContext) => Promise<TUrlsReturn> | TUrlsReturn;
  fetchOptions?: RequestInit;
  cacheOptions?: Omit<WriteCacheOptions<unknown>, "transform">;
  transform: (ctx: AdapterContext & TExtraContext, data: ExtractDataTypeFromUrls<TUrlsReturn>) => TTransformOutput;
  aggregate?: (ctx: AdapterContext, data: [TTransformOutput, ...TTransformOutput[]]) => TOutput;
}

export type AdapterHandlers<TAdapter = MojiAdapter<any, any, any>> = {
  [K in keyof TAdapter]: NonNullable<TAdapter[K]> extends AdapterHandler<any, any, any, any> ? K : never;
}[keyof TAdapter];

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

export type UrlBuilder = (ctx: AdapterContext) => Promisable<Arrayable<string> | Arrayable<undefined> | Arrayable<v2_UrlWithCache>>;

export type v2_AdapterHandlerType = "emojis" | "shortcodes" | "sequences" | "variations" | "metadata";

export type v2_ShouldHandleFn<
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
> = (ctx: TContext & TExtraContext) => Promisable<boolean>;

type Arrayable<T> = T | T[];

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
  TTransformOutput,
> = (ctx: TContext & TExtraContext, data: string) => TTransformOutput;

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

export interface v2_AdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
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
  shouldHandle?: v2_ShouldHandleFn<TContext, TExtraContext>;

  /**
   * A list of other "handlers types", that is required to be run before this handler.
   */
  dependencies?: string[];

  /**
   * A transform function that will run for each of the urls.
   * It will pass the returned type downwards to either the aggregate function or the output.
   */
  transform: v2_TransformFn<TContext, TExtraContext, TTransformOutput>;

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

export function defineAdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput,
>(
  handler: Omit<
    v2_AdapterHandler<
      TType,
      TExtraContext,
      TContext,
      TTransformOutput,
      TAggregateOutput
    >,
"output" | "aggregate"
  > & {
    aggregate: v2_AggregateFn<TContext, TExtraContext, TTransformOutput, TAggregateOutput>;
    output: v2_OutputFn<TContext, TExtraContext, TAggregateOutput, any>;
  }
): v2_AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  ReturnType<typeof handler.output>
>;

export function defineAdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
>(
  handler: Omit<
    v2_AdapterHandler<TType, TExtraContext, TContext, TTransformOutput>,
    "output"
  > & {
    output: v2_OutputFn<TContext, TExtraContext, TTransformOutput, any>;
  }
): v2_AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TTransformOutput,
  ReturnType<typeof handler.output>
>;

export function defineAdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
>(handler: v2_AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  TOutput
>): v2_AdapterHandler<
    TType,
    TExtraContext,
    TContext,
    TTransformOutput,
    TAggregateOutput,
    TOutput
  > {
  return handler as any;
}
