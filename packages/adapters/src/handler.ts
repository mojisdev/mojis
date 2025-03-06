import type { AdapterContext, AdapterHandlerType, UrlBuilder, UrlWithCache } from "./types";
import { createCacheKeyFromUrl, fetchCache, parse } from "@mojis/internal-utils";
import { all_handlers } from "./_handlers";
import { getHandlerUrls, isBuiltinParser, isUrlBuilder } from "./utils";

export async function runAdapterHandler<
  THandlerType extends AdapterHandlerType,
  TContext extends AdapterContext,
>(
  type: THandlerType,
  ctx: TContext,
) {
  const handlerGroup = all_handlers[type];

  if (!handlerGroup) {
    throw new Error(`No handler found for type: ${type}`);
  }

  for (const handler of handlerGroup) {
    // should we execute?
    const shouldExecute = await handler.shouldExecute(ctx);

    if (!shouldExecute) {
      continue;
    }

    const urls = await getHandlerUrls(handler.urls, ctx);
    // fetch all the data from the urls
    const fetchPromises = urls.map(async (url) => {
      return fetchCache(url.url, {
        cacheKey: url.cacheKey,
        parser(data) {
          if (isBuiltinParser(handler.parser)) {
            if (handler.parser !== "splitter") {
              throw new Error(`Parser "${handler.parser}" is not implemented.`);
            }

            const separator = handler.parserOptions?.separator ?? ";";
            return parse(data, {
              separator,
              commentPrefix: "#",
            });
          }

          return handler.parser(ctx, data);
        },
        ttl: handler.cacheOptions?.ttl,
        cacheFolder: handler.cacheOptions?.cacheFolder,
        encoding: handler.cacheOptions?.encoding,
        options: handler.fetchOptions,
        bypassCache: ctx.force,
      });
    });

    const dataList = await Promise.all(fetchPromises);

    // run transform for each data in list
    for (const data of dataList) {
      // run transform for each data in list

      const transformedData = await handler.transform(ctx, data);
    }
  }
}
