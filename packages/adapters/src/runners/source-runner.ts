import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnySourceAdapter, InferHandlerOutput } from "../builders/source-builder/types";
import type { AdapterContext } from "../global-types";
import path, { join } from "node:path";
import { arktypeParse } from "@mojis/internal-utils";
import fs from "fs-extra";
import { AdapterError } from "../errors";
import { runVersionedSourceTransformer } from "./version-runner";

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
): Promise<TOptions["write"] extends false ? InferHandlerOutput<THandler> : void> {
  const promises = [];

  let output = (typeof handler.fallback == "function" && handler.fallback != null) ? handler.fallback() : undefined;

  for (const [predicate, sourceTransformer] of handler.handlers) {
    if (!predicate(ctx.emoji_version)) {
      console.error(`skipping handler ${handler.adapterType} because predicate returned false`);
      continue;
    }

    promises.push(runVersionedSourceTransformer(ctx, sourceTransformer, handler.adapterType, {
      cacheOptions: options?.cacheOptions,
      cacheKey: options?.cacheKey,
      cache: options?.cache,
    }));
  }

  const result = await Promise.all(promises);

  if (result.length > 0 && result[0] != null) {
    // TODO: what if we have multiple handlers for the same predicate?
    output = result[0];
  }

  if (handler.transformerSchema == null) {
    throw new Error(`no transformer schema defined for adapter ${handler.adapterType}`);
  }

  const validationResult = arktypeParse(output, handler.transformerSchema);

  if (!validationResult.success) {
    throw new AdapterError(`invalid output for handler: ${handler.adapterType}`);
  }

  if (!options?.write) {
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

      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);

      // Skip if file exists and force is false
      if (!force && await fs.pathExists(filePath)) {
        console.warn(`File exists and force is false, skipping: ${filePath}`);
        return;
      }

      // Write the file
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

  return undefined as unknown as TOptions["write"] extends false ? InferHandlerOutput<THandler> : void;
}
