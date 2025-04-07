import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnyAdapterHandler, InferHandlerOutput } from "./adapter-builder/types";
import type {
  AdapterContext,
  AdapterHandlerType,
} from "./global-types";
import type { AnyVersionHandler } from "./version-builder/types";
import { arktypeParse, fetchCache } from "@mojis/internal-utils";
import { genericParse } from "@mojis/parsers";
import { type } from "arktype";
import { defu } from "defu";
import { AdapterError } from "./errors";
import { metadata, sequences, unicodeNames, variations } from "./handlers";
import { buildContext, getHandlerUrls, isBuiltinParser } from "./utils";

export type { AdapterHandlerType } from "./global-types";

export interface RunOverrides {
  cacheKey?: string;
  cacheOptions?: CacheOptions;
  cache?: Cache<string>;
}

export const HANDLERS = {
  metadata,
  sequences,
  "unicode-names": unicodeNames,
  variations,
} satisfies Record<AdapterHandlerType, AnyAdapterHandler>;

export async function runAdapterHandler<
  TAdapterHandlerType extends AdapterHandlerType,
  THandler extends AnyAdapterHandler = typeof HANDLERS[TAdapterHandlerType],
>(
  type: TAdapterHandlerType,
  ctx: AdapterContext,
  __overrides?: RunOverrides,
): Promise<InferHandlerOutput<THandler>> {
  const handler = HANDLERS[type];

  const promises = [];

  let output = (typeof handler.fallback == "function" && handler.fallback != null) ? handler.fallback() : undefined;

  for (const [predicate, versionHandler] of handler.handlers) {
    if (!predicate(ctx.emoji_version)) {
      console.error(`skipping handler ${type} because predicate returned false`);
      continue;
    }

    promises.push(runVersionHandler(ctx, versionHandler, handler.adapterType, __overrides));
  }

  const result = await Promise.all(promises);

  if (result.length > 0 && result[0] != null) {
    // TODO: what if we have multiple handlers for the same predicate?
    output = result[0];
  }

  if (handler.outputSchema == null) {
    return output as InferHandlerOutput<THandler>;
  }

  const validationResult = arktypeParse(output, handler.outputSchema);

  if (!validationResult.success) {
    throw new AdapterError(`Invalid output for handler: ${type}`);
  }

  return validationResult.data as InferHandlerOutput<THandler>;
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
      cache: __overrides?.cache,
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
      cacheOptions: mergedCacheOptions,
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
