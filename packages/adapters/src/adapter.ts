import type {
  AdapterContext,
  AdapterHandler,
  AdapterHandlers,
  ExtractDataTypeFromUrls,
  MojiAdapter,
  UrlWithCacheKeyReturnType,
} from "./types";
import { type EmojiVersion, fetchCache } from "@mojis/internal-utils";
import semver from "semver";

import { baseAdapter } from "./adapters/_base/adapter";
import { modernAdapter } from "./adapters/modern/adapter";

interface AdapterRegistry {
  [key: string]: MojiAdapter<any, any, any>;
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
  TMetadataUrlReturn extends UrlWithCacheKeyReturnType,
  TSequencesUrlReturn extends UrlWithCacheKeyReturnType,
  TVariationsUrlReturn extends UrlWithCacheKeyReturnType,
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
  TUrlReturn extends UrlWithCacheKeyReturnType = THandlerFn extends AdapterHandler<infer U, any> ? U : never,
  TOutput = THandlerFn extends AdapterHandler<any, infer V> ? V : never,
>(
  adapter: TAdapter,
  handlerName: THandler,
  ctx: AdapterContext,
): Promise<TOutput> {
  // we know this is an AdapterHandler because of the constraint on THandler
  const handler = adapter[handlerName] as unknown as AdapterHandler<TUrlReturn, TOutput>;

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

  // handle multiple urls
  if (Array.isArray(urlsResult)) {
    const dataPromises = urlsResult.map((item) =>
      fetchCache(item.url, {
        cacheKey: item.cacheKey,
        parser: (data) => data,
      }),
    );

    const dataArray = await Promise.all(dataPromises);
    return handler.transform(ctx, dataArray as ExtractDataTypeFromUrls<TUrlReturn>);
  } else {
    const data = await fetchCache(urlsResult.url, {
      cacheKey: urlsResult.cacheKey,
      parser: (data) => data,
    });
    return handler.transform(ctx, data as ExtractDataTypeFromUrls<TUrlReturn>);
  }
}
