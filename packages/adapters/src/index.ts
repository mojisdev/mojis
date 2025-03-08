import type { AdapterContext, AdapterHandlerType, InferOutputFromAdapterHandlerType } from "./types";
import { fetchCache } from "@mojis/internal-utils";
import { genericParse } from "@mojis/parsers";
import { ALL_HANDLERS } from "./handlers";
import { buildContext, getHandlerUrls, isBuiltinParser } from "./utils";

export async function runAdapterHandler<
  TAdapterHandlerType extends AdapterHandlerType,
  TContext extends AdapterContext,
  TExtraContext extends Record<string, unknown>,
>(
  type: TAdapterHandlerType,
  ctx: TContext & TExtraContext,
): Promise<InferOutputFromAdapterHandlerType<TAdapterHandlerType>> {
  const handlerGroup = ALL_HANDLERS[type];

  if (!handlerGroup) {
    throw new Error(`No handler found for type: ${type}`);
  }

  for (const handler of handlerGroup) {
    // figure out if we should execute this handler
    const shouldExecute = await handler.shouldExecute(ctx);

    if (!shouldExecute) {
      continue;
    }

    // generate a list of all urls, that should be handled
    const urls = await getHandlerUrls(handler.urls, ctx);

    // fetch all the data from the urls
    const dataRequests = urls.map(async (url) => {
      const key = url.cacheKey;
      const result = await fetchCache(url.url, {
        cacheKey: url.cacheKey,
        parser(data) {
          if (isBuiltinParser(handler.parser)) {
            if (handler.parser === "generic") {
              return genericParse(data, {
                separator: handler.parserOptions?.separator ?? ";",
                commentPrefix: handler.parserOptions?.commentPrefix ?? "#",
                defaultProperty: handler.parserOptions?.defaultProperty ?? "",
                propertyMap: handler.parserOptions?.propertyMap ?? {},
              });
            }

            throw new Error(`Parser "${handler.parser}" is not implemented.`);
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

    const transformedDataList = [];

    // run transform for each data in list
    for (const [key, data] of dataResults) {
      // Narrow the type of data based on the parser type
      const transformedData = handler.transform(buildContext(ctx, {
        key,
      }), data as any);

      transformedDataList.push(transformedData);
    }

    // only run aggregate if defined, but still call output
    if (!handler.aggregate) {
      const data = transformedDataList.length === 1 ? transformedDataList[0] : transformedDataList;
      // @ts-expect-error i'm not smart enough to fix these
      return handler.output(buildContext(ctx, {}), data);
    }

    const aggregatedData = handler.aggregate(buildContext(ctx, {
      data: transformedDataList,
      // @ts-expect-error i'm not smart enough to fix these
    }), transformedDataList);

    // run output
    const output = handler.output(buildContext(ctx, {
      data: aggregatedData,
      // @ts-expect-error i'm not smart enough to fix these
    }), aggregatedData);

    // @ts-expect-error i'm not smart enough to fix these
    return output;
  }

  throw new Error(`No handler found for type: ${type}`);
}
