import type {
  AdapterContext,
  AdapterHandler,
  AdapterHandlers,
  CacheableUrlRequestReturnType,
  ExtractDataTypeFromUrls,
  MojiAdapter,
} from "./types";
import { createCacheKeyFromUrl, type EmojiVersion, fetchCache } from "@mojis/internal-utils";
import { defu } from "defu";
import semver from "semver";
import { baseAdapter } from "./adapters/_base/adapter";
import { modernAdapter } from "./adapters/modern/adapter";

interface AdapterRegistry {
  [key: string]: MojiAdapter<
    any, // metadata
    any, // sequence
    any // variations
  >;
}

const ADAPTERS: AdapterRegistry = {
  base: baseAdapter,
  modern: modernAdapter,
};

type ExtractAdapterType<T> = T extends MojiAdapter<
  infer Metadata,
  infer Sequences,
  infer Variations
> ? MojiAdapter<
    Metadata,
    Sequences,
    Variations
  > : never;

export function resolveAdapter<T extends EmojiVersion>(
  emojiVersion: T,
): ExtractAdapterType<typeof baseAdapter> | ExtractAdapterType<typeof modernAdapter> | null {
  const version = semver.coerce(emojiVersion.emoji_version);

  if (version == null) {
    throw new Error(`invalid emoji version ${emojiVersion.emoji_version}`);
  }

  const matchingAdapters = Object.values(ADAPTERS).filter((adapter) =>
    semver.satisfies(version, adapter.range),
  );

  if (matchingAdapters.length === 0) {
    throw new Error(`no adapter found for version ${version}`);
  }

  if (matchingAdapters.length > 1) {
    return matchingAdapters.reduce((selected, current) => {
      const selectedLower = semver.minVersion(selected.range);
      const currentLower = semver.minVersion(current.range);

      if (!selectedLower || !currentLower) {
        return extendAdapter(selected);
      }

      const adapter = semver.gt(currentLower, selectedLower) ? current : selected;

      return extendAdapter(adapter);
    });
  }

  if (matchingAdapters.length === 1 && matchingAdapters[0] != null) {
    return extendAdapter(matchingAdapters[0]);
  }

  return null;
}

function extendAdapter<
  TMetadataUrlReturn extends CacheableUrlRequestReturnType,
  TSequencesUrlReturn extends CacheableUrlRequestReturnType,
  TVariationsUrlReturn extends CacheableUrlRequestReturnType,
>(
  adapter: MojiAdapter<
    TMetadataUrlReturn,
    TSequencesUrlReturn,
    TVariationsUrlReturn
  >,
): MojiAdapter<
    TMetadataUrlReturn,
    TSequencesUrlReturn,
    TVariationsUrlReturn
  > {
  if (adapter.extend == null) {
    return adapter;
  }

  const parent = ADAPTERS[adapter.extend];

  if (parent == null) {
    throw new Error(
      `adapter ${adapter.name} extends ${adapter.extend}, but ${adapter.extend} is not registered`,
    );
  }

  return Object.assign({}, parent, adapter) as MojiAdapter<
    TMetadataUrlReturn,
    TSequencesUrlReturn,
    TVariationsUrlReturn
  >;
}

export async function runAdapterHandler<
  TAdapter extends MojiAdapter<any, any, any>,
  THandler extends AdapterHandlers<TAdapter>,
  THandlerFn extends NonNullable<TAdapter[THandler]>,
  TUrlReturn extends CacheableUrlRequestReturnType = THandlerFn extends AdapterHandler<infer U, any, any> ? U : never,
  TExtraContext extends Record<string, unknown> = THandlerFn extends AdapterHandler<any, infer E, any> ? E : never,
  TTransformOutput = THandlerFn extends AdapterHandler<any, any, infer V, any> ? V : never,
  TOutput = THandlerFn extends AdapterHandler<any, any, any, infer V> ? V : never,
>(
  adapter: TAdapter,
  handlerName: THandler,
  ctx: AdapterContext,
): Promise<TOutput> {
  // we know this is an AdapterHandler because of the constraint on THandler
  const handler = adapter[handlerName] as unknown as AdapterHandler<TUrlReturn, AdapterContext & TExtraContext, TTransformOutput, TOutput>;

  if (!handler) {
    throw new Error(`Handler ${String(handlerName)} not found in adapter ${adapter.name}`);
  }

  // check if urls method exists
  if (!handler.urls) {
    throw new Error(`Handler ${String(handlerName)} in adapter ${adapter.name} does not have a urls function`);
  }

  const urlsResult = await handler.urls(ctx);

  // early return for undefined
  if (urlsResult === undefined) {
    // @ts-expect-error - we're returning undefined but TypeScript doesn't know this matches TOutput
    return undefined;
  }

  if (!Array.isArray(urlsResult)) {
    const cacheOptions = defu(urlsResult.cacheOptions || {}, handler.cacheOptions || {});
    const fetchOptions = defu(urlsResult.fetchOptions || {}, handler.fetchOptions || {});
    const key = urlsResult.key ?? createCacheKeyFromUrl(urlsResult.url);

    const newCtx = {
      ...urlsResult.extraContext,
      key,
      emoji_version: ctx.emoji_version,
      force: ctx.force,
      unicode_version: ctx.unicode_version,
    } as unknown as AdapterContext & TExtraContext;

    const data = await fetchCache(urlsResult.url, {
      cacheKey: urlsResult.cacheKey ?? `v${ctx.emoji_version}/${createCacheKeyFromUrl(urlsResult.url)}`,
      parser: (data) => data,
      options: fetchOptions,
      cacheFolder: cacheOptions.cacheFolder,
      encoding: cacheOptions.encoding,
      ttl: cacheOptions.ttl,
      bypassCache: ctx.force,
    });

    return handler.transform(newCtx, data as unknown as ExtractDataTypeFromUrls<TUrlReturn>) as unknown as TOutput;
  }

  const promises = urlsResult.map(async (item) => {
    const key = item.key ?? createCacheKeyFromUrl(item.url);
    const cacheOptions = defu(item.cacheOptions || {}, handler.cacheOptions || {});
    const fetchOptions = defu(item.fetchOptions || {}, handler.fetchOptions || {});

    const data = await fetchCache(item.url, {
      cacheKey: item.cacheKey ?? `v${ctx.emoji_version}/${createCacheKeyFromUrl(item.url)}`,
      parser: (data) => data,
      options: fetchOptions,
      cacheFolder: cacheOptions.cacheFolder,
      encoding: cacheOptions.encoding,
      ttl: cacheOptions.ttl,
      bypassCache: ctx.force,
    });

    const newCtx = {
      ...item.extraContext,
      key,
      emoji_version: ctx.emoji_version,
      force: ctx.force,
      unicode_version: ctx.unicode_version,
    } as unknown as AdapterContext & TExtraContext;

    return handler.transform(newCtx, data as ExtractDataTypeFromUrls<TUrlReturn>);
  });

  const results = await Promise.all(promises);

  if (handler.aggregate == null) {
    throw new Error(`Handler ${String(handlerName)} in adapter ${adapter.name} does not have an aggregate function`);
  }

  if (results.length === 0) {
    throw new Error(`Handler ${String(handlerName)} in adapter ${adapter.name} returned an empty array.`);
  }

  return handler.aggregate(ctx, [results[0]!, ...results.slice(1)]);
}
