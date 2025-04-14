/* eslint-disable ts/explicit-function-return-type */
import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions } from "@mojis/parsers";
import type { type } from "arktype";
import type { AnyCompositeHandler } from "../src/builders/composite-builder/types";
import type {
  AnyBuiltSourceAdapterParams,
  AnySourceAdapter,
  FallbackFn,
  PersistenceFn,
  PredicateFn,
  SourceAdapter,
} from "../src/builders/source-builder/types";
import type { AnyVersionedSourceTransformer, VersionedSourceTransformer } from "../src/builders/version-builder/types";
import type {
  AdapterContext,
  BuiltinParser,
  PossibleUrls,
  SourceAdapterType,
} from "../src/global-types";
import { createCache } from "@mojis/internal-utils";

export interface SetupAdapterTestOptions {
  cache?: Cache<string>;
}

export async function setupAdapterTest(options?: SetupAdapterTestOptions) {
  const cache = options?.cache ?? createCache<string>({ store: "memory" });

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runSourceAdapter: runSourceAdapterOriginal } = await import("../src/runners/source-runner");
  const { runCompositeHandler: runCompositeHandlerOriginal } = await import("../src/runners/composite-runner");

  function runSourceAdapter<THandler extends AnySourceAdapter>(
    ...args: Parameters<typeof runSourceAdapterOriginal<THandler, {
      write: false;
    }>>
  ) {
    const [type, ctx, opts] = args;
    return runSourceAdapterOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
      write: false,
    });
  }

  function runCompositeHandler<THandler extends AnyCompositeHandler>(
    ...args: Parameters<typeof runCompositeHandlerOriginal<THandler>>
  ) {
    const [type, ctx, opts] = args;
    return runCompositeHandlerOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
    });
  }

  return {
    runSourceAdapter,
    runCompositeHandler,
  };
}

export function createFakeSourceAdapter<TParams extends AnyBuiltSourceAdapterParams>(
  opts: TParams,
): SourceAdapter<{
    adapterType: TParams["adapterType"];
    handlers: [PredicateFn, AnyVersionedSourceTransformer][];
    transformerSchema: TParams["transformerSchema"];
    outputSchema: TParams["outputSchema"];
    fallback: FallbackFn<TParams["transformerSchema"]>;
    persistence?: PersistenceFn<
      TParams["transformerSchema"] extends type.Any
        ? TParams["transformerSchema"]["infer"]
        : any,
      TParams["outputSchema"] extends type.Any
        ? TParams["outputSchema"]["infer"]
        : any
    >;
    persistenceOptions?: TParams["persistenceOptions"];
  }> {
  return {
    adapterType: opts.adapterType,
    handlers: opts.handlers,
    outputSchema: opts.outputSchema,
    transformerSchema: opts.transformerSchema,
    fallback: opts.fallback,
    persistenceOptions: opts.persistenceOptions,
    persistence: opts.persistence,
  };
}

export type CreateAnySourceAdapter<
  TAdapterType extends SourceAdapterType,
  TConfig extends Omit<AnyBuiltSourceAdapterParams, "adapterType" | "handlers"> & {
    handlers: AnyVersionedSourceTransformer[];
  },
> = SourceAdapter<{
  adapterType: TAdapterType;
  handlers: [PredicateFn, TConfig["handlers"][number]][];
  transformerSchema: TConfig["transformerSchema"];
  outputSchema: TConfig["outputSchema"];
  fallback: TConfig["fallback"];
  persistence: TConfig["persistence"];
  persistenceOptions: TConfig["persistenceOptions"];
}>;

export type CreateVersionedSourceTransformer<TConfig extends {
  output: unknown;
  params?: Record<string, any>;
}> = VersionedSourceTransformer<{
  globalContext: AdapterContext;
  fetchOptions: RequestInit;
  cacheOptions: CacheOptions;
  parser: BuiltinParser;
  parserOptions: GenericParseOptions;
  parserOutput: unknown;
  outputSchema: type.Any;
  urls: PossibleUrls;
  transform: unknown;
  aggregate: unknown;
  output: TConfig["output"];
}>;
