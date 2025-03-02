import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiShortcode,
  EmojiVariation,
  EmojiVersion,
  ShortcodeProvider,
} from "@mojis/internal-utils";

export interface MojiAdapter<
  TMetadataUrlReturn extends UrlWithCacheKeyReturnType,
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
}

export interface UrlWithCacheKey {
  url: string;
  cacheKey: string;
}

export type UrlWithCacheKeyReturnType = UrlWithCacheKey | UrlWithCacheKey[] | undefined;

export type ExtractDataTypeFromUrls<T extends UrlWithCacheKeyReturnType> =
T extends undefined ? undefined :
  T extends UrlWithCacheKey ? string :
    T extends UrlWithCacheKey[] ? string[] :
      never;

export interface AdapterHandler<
  TUrlsReturn extends UrlWithCacheKeyReturnType,
  TOutput,
> {
  urls?: (ctx: AdapterContext) => Promise<TUrlsReturn> | TUrlsReturn;
  transform: (ctx: AdapterContext, data: ExtractDataTypeFromUrls<TUrlsReturn>) => TOutput;
}

export type AdapterHandlers<TAdapter = MojiAdapter<any>> = {
  [K in keyof TAdapter]: NonNullable<TAdapter[K]> extends AdapterHandler<any, any> ? K : never;
}[keyof TAdapter];

export interface AdapterContext {
  force: boolean;
  emoji_version: string;
  unicode_version: string;
}
