import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnySourceAdapter, InferHandlerOutput } from "../builders/source-builder/types";
import type { AdapterContext } from "../global-types";
import { arktypeParse } from "@mojis/internal-utils";
import { AdapterError } from "../errors";
import { runVersionedSourceTransformer } from "./version-runner";

export interface RunSourceAdapterOverrides {
  cacheKey?: string;
  cacheOptions?: CacheOptions;
  cache?: Cache<string>;
}

export async function runSourceAdapter<
  THandler extends AnySourceAdapter,
>(
  handler: THandler,
  ctx: AdapterContext,
  __overrides?: RunSourceAdapterOverrides,
): Promise<InferHandlerOutput<THandler>> {
  const promises = [];

  let output = (typeof handler.fallback == "function" && handler.fallback != null) ? handler.fallback() : undefined;

  for (const [predicate, versionHandler] of handler.handlers) {
    if (!predicate(ctx.emoji_version)) {
      console.error(`skipping handler ${handler.adapterType} because predicate returned false`);
      continue;
    }

    promises.push(runVersionedSourceTransformer(ctx, versionHandler, handler.adapterType, __overrides));
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
    throw new AdapterError(`Invalid output for handler: ${handler.adapterType}`);
  }

  return validationResult.data as InferHandlerOutput<THandler>;
}
