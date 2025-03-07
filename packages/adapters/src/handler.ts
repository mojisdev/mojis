import type { AdapterContext, AdapterHandlerType, UrlBuilder, UrlWithCache } from "./types";
import { createCacheKeyFromUrl, fetchCache } from "@mojis/internal-utils";
import { parse } from "@mojis/parsers";
import { all_handlers } from "./_handlers";
import { getHandlerUrls, isBuiltinParser, isUrlBuilder } from "./utils";

export async function runAdapterHandler<
  THandlerType extends AdapterHandlerType,
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
>(
  type: THandlerType,
  ctx: TContext & TExtraContext,
): Promise<any> {
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
    const dataRequests = urls.map(async (url) => {
      const key = url.cacheKey;
      const result = await fetchCache(url.url, {
        cacheKey: url.cacheKey,
        parser(data) {
          if (isBuiltinParser(handler.parser)) {
            if (handler.parser !== "generic") {
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
      return [key, result] as [string, typeof result];
    });

    const dataResults = await Promise.all(dataRequests);

    const transformedDataList: any[] = [];

    // run transform for each data in list
    for (const [key, data] of dataResults) {
      // run transform for each data in list

      const transformedData = await handler.transform(buildContext(ctx, {
        key,
      }), data);

      console.log("transformedData", transformedData);

      transformedDataList.push(transformedData);
    }

    // run aggregate
    const aggregatedData = await handler.aggregate(buildContext(ctx, {
      data: transformedDataList,
    }), transformedDataList);

    // run output
    const output = await handler.output(buildContext(ctx, {
      data: aggregatedData,
    }), aggregatedData);

    return output;
  }

  throw new Error(`No handler found for type: ${type}`);
}

function buildContext<TContext extends AdapterContext, TExtraContext extends Record<string, unknown>>(
  ctx: TContext,
  extraContext: TExtraContext,
): TContext {
  return Object.assign({}, ctx, extraContext);
}
