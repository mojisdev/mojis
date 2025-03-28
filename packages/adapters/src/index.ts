import type { WriteCacheOptions } from "@mojis/internal-utils";
import type {
  AdapterContext,
  AdapterHandlerType,
  AnyAdapterHandler,
  AnyVersionHandler,
} from "./types";
import { fetchCache } from "@mojis/internal-utils";
import { genericParse } from "@mojis/parsers";
import { defu } from "defu";
import { AdapterError } from "./errors";
import { metadata, sequences, unicodeNames, variations } from "./handlers";
import { buildContext, getHandlerUrls, isBuiltinParser } from "./utils";

export type { AdapterHandlerType } from "./types";

interface RunOverrides {
  cacheKey?: string;
  cacheOptions?: Omit<WriteCacheOptions, "transform">;
}

const HANDLERS = {
  metadata,
  sequences,
  "unicode-names": unicodeNames,
  variations,
} satisfies Record<AdapterHandlerType, AnyAdapterHandler>;

export async function runAdapterHandler<
  TAdapterHandlerType extends AdapterHandlerType,
>(
  type: TAdapterHandlerType,
  ctx: AdapterContext,
  __overrides?: RunOverrides,
  // TODO(luxass): fix return type
): Promise<any> {
  const handler = HANDLERS[type];

  const promises = [];

  for (const [predicate, versionHandler] of handler.handlers) {
    if (!predicate(ctx.emoji_version)) {
      continue;
    }

    promises.push(runVersionHandler(ctx, versionHandler, handler.adapterType, __overrides));
  }

  const result = await Promise.all(promises);
  // TODO: what if we want to return multiple handlers?
  return result[0];
}

export async function runVersionHandler<THandler extends AnyVersionHandler>(
  ctx: AdapterContext,
  handler: THandler,
  adapterHandlerType: AdapterHandlerType,
  __overrides?: RunOverrides,
): Promise<THandler["output"]> {
  const urls = await getHandlerUrls(handler.urls, ctx);

  if (urls.length === 0) {
    throw new AdapterError(`no urls found for handler: ${adapterHandlerType}`);
  }

  // fetch all the data from the urls
  const dataRequests = urls.map(async (url) => {
    const key = url.cacheKey;

    const mergedCacheOptions = defu(__overrides?.cacheOptions, handler.cacheOptions);

    const result = await fetchCache(url.url, {
      cacheKey: url.cacheKey,
      parser(data) {
        if (isBuiltinParser(handler.parser)) {
          if (handler.parser === "generic") {
            const parserOptions = typeof handler.parserOptions === "function"
              ? handler.parserOptions(
                  buildContext(ctx, {
                    key,
                  }),
                )
              : handler.parserOptions;

            return genericParse(data, {
              separator: parserOptions?.separator ?? ";",
              commentPrefix: parserOptions?.commentPrefix ?? "#",
              defaultProperty: parserOptions?.defaultProperty ?? "",
              propertyMap: parserOptions?.propertyMap ?? {},
            });
          }

          throw new AdapterError(`Parser "${handler.parser}" is not implemented.`);
        }

        return handler.parser(ctx, data);
      },
      ttl: mergedCacheOptions.ttl,
      encoding: mergedCacheOptions.encoding,
      cacheFolder: mergedCacheOptions.cacheFolder,
      options: handler.fetchOptions,
      bypassCache: ctx.force,
    });
    return [key, result] as [string, typeof result];
  });

  const dataResults = await Promise.all(dataRequests);

  const transformedDataList = [];

  // run transform for each data in list
  for (const [key, data] of dataResults) {
    // Narrow the type of data based on the parser type
    const transformedData = handler.transform(buildContext(ctx, {
      key,
    }), data as any);

    transformedDataList.push(transformedData);
  }

  let output: THandler["output"];

  if (!handler.aggregate) {
    const data = transformedDataList.length === 1 ? transformedDataList[0] : transformedDataList;
    output = handler.output(ctx, data);
  } else {
    const aggregatedData = handler.aggregate(ctx, transformedDataList);
    output = handler.output(ctx, aggregatedData);
  }

  return output;
}
