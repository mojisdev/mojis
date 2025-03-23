import type { AdapterContext, AdapterHandler } from "./types";
import { fetchCache } from "@mojis/internal-utils";
import { genericParse } from "@mojis/parsers";
import { AdapterError } from "./errors";
import { buildContext, getHandlerUrls, isBuiltinParser } from "./utils";

export async function runAdapterHandler(handler: AdapterHandler, ctx: AdapterContext) {
  for (const [predicate, versionHandler] of handler.versionHandlers) {
    if (!predicate(ctx.emoji_version)) {
      continue;
    }

    const urls = await getHandlerUrls(versionHandler.urls(ctx), ctx);

    if (urls.length === 0) {
      throw new AdapterError(`No urls found for handler: ${handler.adapterType}`);
    }

    // fetch all the data from the urls
    const dataRequests = urls.map(async (url) => {
      const key = url.cacheKey;
      const result = await fetchCache(url.url, {
        cacheKey: url.cacheKey,
        parser(data) {
          if (isBuiltinParser(versionHandler.parser)) {
            if (versionHandler.parser === "generic") {
              const parserOptions = typeof versionHandler.parserOptions === "function"
                ? versionHandler.parserOptions(
                    buildContext(ctx, {
                      key,
                    }),
                  )
                : versionHandler.parserOptions;

              return genericParse(data, {
                separator: parserOptions?.separator ?? ";",
                commentPrefix: parserOptions?.commentPrefix ?? "#",
                defaultProperty: parserOptions?.defaultProperty ?? "",
                propertyMap: parserOptions?.propertyMap ?? {},
              });
            }

            throw new AdapterError(`Parser "${versionHandler.parser}" is not implemented.`);
          }

          return versionHandler.parser(ctx, data);
        },
        ttl: versionHandler.cacheOptions?.ttl,
        cacheFolder: versionHandler.cacheOptions?.cacheFolder,
        encoding: versionHandler.cacheOptions?.encoding,
        options: versionHandler.fetchOptions,
        bypassCache: ctx.force,
      });
      return [key, result] as [string, typeof result];
    });

    const dataResults = await Promise.all(dataRequests);

    const transformedDataList = [];

    // run transform for each data in list
    for (const [key, data] of dataResults) {
      // Narrow the type of data based on the parser type
      const transformedData = versionHandler.transform(buildContext(ctx, {
        key,
      }), data as any);

      transformedDataList.push(transformedData);
    }

    // only run aggregate if defined, but still call output
    if (!versionHandler.aggregate) {
      const data = transformedDataList.length === 1 ? transformedDataList[0] : transformedDataList;
      return versionHandler.output(ctx, data);
    }

    const aggregatedData = versionHandler.aggregate(ctx, transformedDataList);

    // run output
    const output = versionHandler.output(ctx, aggregatedData);

    return output;
  }
}
