import type { AnySourceAdapter } from "./builders/adapter-builder/types";
import type { BUILTIN_PARSERS } from "./utils";

/**
 * A type that can be an array or a single value.
 */
export type MaybeArray<T> = T | T[];

/**
 * A type that can be a value or a promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * The type of the adapter handler.
 */
export type SourceAdapterType =
  | "metadata"
  | "variations"
  | "unicode-names"
  | "sequences";

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

export type PossibleUrls =
  | MaybeArray<UrlWithCache>
  | MaybeArray<string>
  | MaybeArray<undefined>;

export type BuiltinParser = (typeof BUILTIN_PARSERS)[number];

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
};

export type ErrorMessage<TError extends string> = TError;

export type MergeTuple<
  A extends unknown[],
  B extends unknown[],
> = B extends [infer H, ...infer T] ? MergeTuple<[...A, H], T> : A;

/**
 * Get the correct adapter handler based
 * on the adapter type.
 */
export type GetAdapterHandlerFromType<
  TAdapterType extends string,
  TAdapterHandlers extends AnySourceAdapter[],
> = TAdapterHandlers extends Array<infer THandler>
  ? THandler extends AnySourceAdapter
    ? THandler["adapterType"] extends TAdapterType
      ? THandler
      : never
    : never
  : never;

export type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
