import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiVariation,
  WriteCacheOptions,
} from "@mojis/internal-utils";

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
  force: boolean;
  emoji_version: string;
  unicode_version: string;
}
