import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiShortcode,
  EmojiVariation,
  EmojiVersion,
  ShortcodeProvider,
} from "@mojis/internal-utils";
import type { WriteCacheOptions } from "packages/internal-utils/dist";

export interface MojiAdapter<
  TMetadataUrlReturn extends CacheableUrlRequestReturnType,
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
  metadata?: AdapterHandler<TMetadataUrlReturn, ExtraContext<TMetadataUrlReturn>, {
    groups: EmojiGroup[];
    emojis: Record<string, Record<string, EmojiMetadata>>;
  }>;
}

type ExtraContext<T> = {
  key: string;
} & (T extends CacheableUrlRequest ? T["extraCtx"] : never);

// TODO: give a better name
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
   * @default ""
   */
  cacheKey: string;

  /**
   * Extra data to be passed to the handler.
   * @default {}
   */
  extraCtx?: Record<string, unknown>;

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
    T extends CacheableUrlRequest ? string
      : T extends CacheableUrlRequest[] ? string
        : never;

export interface AdapterHandler<
  TUrlsReturn extends CacheableUrlRequestReturnType,
  TExtraContext extends Record<string, unknown>,
  TOutput,
> {
  urls: (ctx: AdapterContext) => Promise<TUrlsReturn> | TUrlsReturn;
  fetchOptions?: RequestInit;
  cacheOptions?: Omit<WriteCacheOptions<any>, "transform">;
  transform: (ctx: AdapterContext & TExtraContext, data: ExtractDataTypeFromUrls<TUrlsReturn>) => TOutput;
}

export type AdapterHandlers<TAdapter = MojiAdapter<any>> = {
  [K in keyof TAdapter]: NonNullable<TAdapter[K]> extends AdapterHandler<any, any, any> ? K : never;
}[keyof TAdapter];

export interface AdapterContext {
  force: boolean;
  emoji_version: string;
  unicode_version: string;
}
