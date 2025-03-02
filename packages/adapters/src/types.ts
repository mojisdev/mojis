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
  TMetadataUrlReturn extends UrlWithCacheKeyReturnType,
  TSequencesUrlReturn extends UrlWithCacheKeyReturnType,
  TVariationsUrlReturn extends UrlWithCacheKeyReturnType,
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
  metadata?: AdapterHandler<TMetadataUrlReturn, {
    groups: EmojiGroup[];
    emojis: Record<string, Record<string, EmojiMetadata>>;
  }>;

  /**
   * The sequences handler for the adapter.
   */
  sequences?: AdapterHandler<TSequencesUrlReturn, {
    sequences: EmojiSequence[];
    zwj: EmojiSequence[];
  }>;

  /**
   * The variations handler for the adapter.
   */
  variations?: AdapterHandler<TVariationsUrlReturn, EmojiVariation[]>;
}

export interface UrlWithCacheKey {
  url: string;
  cacheKey: string;
}

export interface UrlWithCacheKeyAndKey extends UrlWithCacheKey {
  key: string;
}

export type UrlWithCacheKeyReturnType = UrlWithCacheKey | UrlWithCacheKeyAndKey[] | undefined;

export type ExtractDataTypeFromUrls<T extends UrlWithCacheKeyReturnType> =
T extends undefined ? undefined :
  T extends UrlWithCacheKey ? string :
    T extends UrlWithCacheKey[] ? { key: string; data: string }[] :
      never;

export interface AdapterHandler<
  TUrlsReturn extends UrlWithCacheKeyReturnType,
  TOutput,
> {
  urls: (ctx: AdapterContext) => Promise<TUrlsReturn> | TUrlsReturn;
  fetchOptions?: RequestInit;
  cacheOptions?: Omit<WriteCacheOptions<any>, "transform">;
  transform: (ctx: AdapterContext, data: ExtractDataTypeFromUrls<TUrlsReturn>) => TOutput;
}

export type AdapterHandlers<TAdapter = MojiAdapter<any, any, any>> = {
  [K in keyof TAdapter]: NonNullable<TAdapter[K]> extends AdapterHandler<any, any> ? K : never;
}[keyof TAdapter];

export interface AdapterContext {
  force: boolean;
  emoji_version: string;
  unicode_version: string;
}
