import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnyCompositeHandler } from "../builders/composite-builder/types";
import type { AdapterContext } from "../global-types";
import { arktypeParse } from "@mojis/internal-utils";
import defu from "defu";
import { AdapterError } from "../errors";
import { runAdapterHandler } from "./adapter-runner";

export interface RunCompositeHandlerOverrides {
  cacheKey?: string;
  cacheOptions?: CacheOptions;
  cache?: Cache<string>;
}

export async function runCompositeHandler<THandler extends AnyCompositeHandler>(
  handler: THandler,
  ctx: AdapterContext,
  __overrides?: RunCompositeHandlerOverrides,
): Promise<THandler["output"]> {
  if (!isValidHandler(handler)) {
    throw new TypeError("provided handler is not valid");
  }

  const sources = await getHandlerSources(handler, ctx, __overrides);
  const adapterSources = await getAdapterSources(handler, ctx, __overrides);

  const mergedSources = defu(sources, adapterSources);

  const transforms = handler.transforms ?? [];

  // start with the sources
  let currentValue = mergedSources;

  // process all transforms sequentially
  for (const transform of transforms) {
    currentValue = await transform(ctx, currentValue);
  }

  // run the output with the final transformed value
  const outputValue = await handler.output(ctx, currentValue);

  const validationResult = arktypeParse(outputValue, handler.outputSchema);

  if (!validationResult.success) {
    throw new AdapterError(`output from composite handler doesn't match output schema, ${validationResult.errors}`);
  }

  return outputValue;
}

async function getAdapterSources(
  handler: AnyCompositeHandler,
  ctx: AdapterContext,
  __overrides?: RunCompositeHandlerOverrides,
): Promise<Record<string, unknown>> {
  if (!Array.isArray(handler.adapterSources)) {
    throw new TypeError("handler.adapterSources must be an array");
  }

  const adapterSourcesValues: Record<string, unknown> = {};

  // run all adapter handlers in parallel and process results directly
  const results = await Promise.all(
    handler.adapterSources.map(async (adapterSource) => {
      const value = await runAdapterHandler(adapterSource, ctx, __overrides);
      return [adapterSource.adapterType, value] as const;
    }),
  );

  // populate the results object
  for (const [key, value] of results) {
    adapterSourcesValues[key] = value;
  }

  return adapterSourcesValues;
}

async function getHandlerSources(
  handler: AnyCompositeHandler,
  ctx: AdapterContext,
  __overrides?: RunCompositeHandlerOverrides,
): Promise<Record<string, unknown>> {
  if (typeof handler.sources !== "object" || handler.sources === null) {
    throw new TypeError("handler.sources must be an object");
  }

  const sourcesValues: Record<string, unknown> = {};
  const sourcesPromises: Array<Promise<[string, unknown]>> = [];

  // process all sources, separating immediate values from promises
  for (const [key, value] of Object.entries(handler.sources)) {
    if (typeof value === "function") {
      sourcesPromises.push(
        Promise.resolve(value(ctx)).then((resolvedValue) => [key, resolvedValue]),
      );
    } else {
      sourcesValues[key] = value;
    }
  }

  // resolve all promises in parallel
  if (sourcesPromises.length > 0) {
    const resolvedEntries = await Promise.all(sourcesPromises);
    for (const [key, value] of resolvedEntries) {
      sourcesValues[key] = value;
    }
  }

  return sourcesValues;
}

function isValidHandler(handler: unknown): handler is AnyCompositeHandler {
  if (typeof handler !== "object" || handler === null) {
    return false;
  }

  const {
    sources,
    outputSchema,
    adapterSources,
    output,
    transforms,
  } = handler as AnyCompositeHandler;

  if (typeof sources !== "object" || sources === null) {
    return false;
  }

  if (typeof adapterSources !== "object" || adapterSources === null || !Array.isArray(adapterSources)) {
    return false;
  }

  if (outputSchema == null) {
    return false;
  }

  if (typeof output !== "function") {
    return false;
  }

  if (typeof transforms !== "object" || transforms === null || !Array.isArray(transforms)) {
    return false;
  }

  return true;
}
