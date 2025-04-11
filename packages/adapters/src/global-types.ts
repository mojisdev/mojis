import type { AnyAdapterHandler } from "./builders/adapter-builder/types";
import type { BUILTIN_PARSERS } from "./utils";

/**
 * A type that can be an array or a single value.
 */
export type MaybeArray<T> = T | T[];

/**
 * The type of the adapter handler.
 */
export type AdapterHandlerType =
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

export type JoinTuples<
  T extends readonly unknown[],
  U extends readonly unknown[],
> = T extends []
  ? U
  : U extends []
    ? T
    : T extends readonly [infer THead, ...infer TRest]
      ? U extends readonly [infer UHead, ...infer URest]
        ? [THead, UHead, ...JoinTuples<TRest, URest>]
        : T
      : U;

/**
 * Get the correct adapter handler based
 * on the adapter type.
 */
export type GetAdapterHandlerFromType<
  TAdapterType extends string,
  TAdapterHandlers extends AnyAdapterHandler[],
> = TAdapterHandlers extends Array<infer THandler>
  ? THandler extends AnyAdapterHandler
    ? THandler["adapterType"] extends TAdapterType
      ? THandler
      : never
    : never
  : never;

export type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
