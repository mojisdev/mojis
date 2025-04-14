import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnySourceAdapter, InferHandlerOutput } from "../builders/source-builder/types";
import type { AdapterContext } from "../global-types";
import path, { join } from "node:path";
import { arktypeParse } from "@mojis/internal-utils";
import fs from "fs-extra";
import { AdapterError } from "../errors";
import { runSourceTransformer } from "./source-transformer-runner";

export interface RunSourceAdapterOptions {
  /**
   * Whether to write the output to disk or not.
   * @default true
   */
  write?: boolean;

  cacheKey?: string;
  cacheOptions?: CacheOptions;
  cache?: Cache<string>;
}

export async function runSourceAdapter<
  THandler extends AnySourceAdapter,
  TOptions extends RunSourceAdapterOptions = RunSourceAdapterOptions,
>(
  handler: THandler,
  ctx: AdapterContext,
  options?: TOptions,
  // TODO: dynamic infer return type based on `write`
): Promise<InferHandlerOutput<THandler>> {
  const promises = [];

  // TODO: make this default to true
  const shouldWrite = options?.write ?? false;

  let output = (typeof handler.fallback == "function" && handler.fallback != null) ? handler.fallback() : undefined;

  for (const [predicate, sourceTransformer] of handler.handlers) {
    if (!predicate(ctx.emoji_version)) {
      console.error(`skipping handler ${handler.adapterType} because predicate returned false`);
      continue;
    }

    promises.push(runSourceTransformer(ctx, sourceTransformer, handler.adapterType, {
      cache: options?.cache,
      cacheKey: options?.cacheKey,
      cacheOptions: options?.cacheOptions,
    }));
  }

  const result = await Promise.all(promises);

  if (result.length > 0 && result[0] != null) {
    // TODO: what if we have multiple handlers for the same predicate?
    output = result[0];
  }

  // TODO: make this required
  if (handler.transformerOutputSchema == null) {
    return output as InferHandlerOutput<THandler>;
    // throw new Error(`no transformer schema defined for adapter ${handler.adapterType}`);
  }

  const validationResult = arktypeParse(output, handler.transformerOutputSchema);

  if (!validationResult.success) {
    throw new AdapterError(`Invalid output for handler: ${handler.adapterType}`);
  }

  if (!shouldWrite) {
    return validationResult.data as InferHandlerOutput<THandler>;
  }

  if (handler.persistence == null) {
    throw new Error(`no persistence function defined for adapter ${handler.adapterType}`);
  }

  const basePath = join("./data", `v${ctx.emoji_version}`);

  const fileOperations = await handler.persistence(validationResult.data, {
    basePath,
    force: ctx.force,
    pretty: handler.persistenceOptions.pretty,
    version: {
      emoji_version: ctx.emoji_version,
      unicode_version: ctx.unicode_version,
    },
  });

  await Promise.all(
    fileOperations.map(async (operation) => {
      const { filePath, data, type, options: fileOptions = {} } = operation;
      const {
        encoding = "utf-8",
        pretty = handler.persistenceOptions.pretty ?? false,
        force = ctx.force ?? false,
      } = fileOptions;

      // create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);

      // skip if file exists and force is false
      if (!force && await fs.pathExists(filePath)) {
        console.warn(`File exists and force is false, skipping: ${filePath}`);
        return;
      }

      // write the file
      if (type === "json") {
        await fs.writeFile(
          filePath,
          pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data),
          { encoding },
        );
      } else {
        await fs.writeFile(
          filePath,
          String(data),
          { encoding },
        );
      }
    }),
  );

  return validationResult.data as InferHandlerOutput<THandler>;
}
