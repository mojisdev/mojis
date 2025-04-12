/* eslint-disable ts/explicit-function-return-type */
import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions } from "@mojis/parsers";
import type { type } from "arktype";
import type { AdapterHandler, AnyAdapterHandler, AnyBuiltAdapterHandlerParams, FallbackFn, PredicateFn } from "../src/builders/adapter-builder/types";
import type { AnyVersionHandler, VersionHandler } from "../src/builders/version-builder/types";
import type {
  AdapterContext,
  BuiltinParser,
  PossibleUrls,
} from "../src/global-types";
import { createCache } from "@mojis/internal-utils";

export interface SetupAdapterTestOptions {
  cache?: Cache<string>;
}

export async function setupAdapterTest(options?: SetupAdapterTestOptions) {
  const cache = options?.cache ?? createCache<string>({ store: "memory" });

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runAdapterHandler: runAdapterHandlerOriginal } = await import("../src/runners/adapter-runner");

  function runAdapterHandler<THandler extends AnyAdapterHandler>(
    ...args: Parameters<typeof runAdapterHandlerOriginal<THandler>>
  ) {
    const [type, ctx, opts] = args;
    return runAdapterHandlerOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
    });
  }

  return {
    runAdapterHandler,
  };
}

export function createFakeAdapterHandler<TParams extends AnyBuiltAdapterHandlerParams>(
  opts: TParams,
): AdapterHandler<{
    adapterType: TParams["adapterType"];
    handlers: TParams["handlers"];
    outputSchema: TParams["outputSchema"];
    fallback: TParams["fallback"];
  }> {
  return {
    adapterType: opts.adapterType,
    handlers: opts.handlers,
    outputSchema: opts.outputSchema,
    fallback: opts.fallback,
  };
}

export type CreateAdapterVersionHandler<TConfig extends {
  output: unknown;
  params?: Record<string, any>;
}> = VersionHandler<{
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

export interface TestBuiltAdapterHandlerParams {
  adapterType: string;
  handlers: [PredicateFn, AnyVersionHandler][];
  outputSchema?: type.Any;
  fallback?: FallbackFn<any>;
}

export interface TestAdapterHandler<TParams extends TestBuiltAdapterHandlerParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  outputSchema?: TParams["outputSchema"];
  fallback?: FallbackFn<
    TParams["outputSchema"] extends type.Any
      ? TParams["outputSchema"]["infer"]
      : any
  >;
}

export type CreateAnyAdapterHandler<
  TType extends string,
  TConfig extends {
    handlers: CreateAdapterVersionHandler<any>[];
    outputSchema?: type.Any;
    fallback?: any;
  },
> = TestAdapterHandler<{
  adapterType: TType;
  handlers: Array<[PredicateFn, TConfig["handlers"][number]]>;
  outputSchema?: TConfig["outputSchema"];
  fallback?: FallbackFn<TConfig["handlers"][number]["output"]>;
}>;
