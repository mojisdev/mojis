/* eslint-disable ts/explicit-function-return-type */
import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions } from "@mojis/parsers";
import type { type } from "arktype";
import type { AnyCompositeHandler } from "../src/builders/composite-builder/types";
import type {
  AnyBuiltSourceAdapterParams,
  AnySourceAdapter,
  FallbackFn,
  PredicateFn,
  SourceAdapter,
} from "../src/builders/source-builder/types";
import type { AnySourceTransformer, SourceTransformer } from "../src/builders/version-builder/types";
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
  const { runSourceAdapter: runSourceAdapterOriginal } = await import("../src/runners/source-runner");
  const { runCompositeHandler: runCompositeHandlerOriginal } = await import("../src/runners/composite-runner");

  function runSourceAdapter<THandler extends AnySourceAdapter>(
    ...args: Parameters<typeof runSourceAdapterOriginal<THandler>>
  ) {
    const [type, ctx, opts] = args;
    return runSourceAdapterOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
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
    handlers: TParams["handlers"];
    transformerOutputSchema: TParams["transformerOutputSchema"];
    fallback: TParams["fallback"];
  }> {
  return {
    adapterType: opts.adapterType,
    handlers: opts.handlers,
    transformerOutputSchema: opts.transformerOutputSchema,
    fallback: opts.fallback,
  };
}

export type CreateSourceTransformer<TConfig extends {
  output: unknown;
  params?: Record<string, any>;
}> = SourceTransformer<{
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

export interface TestBuiltSourceAdapterParams {
  adapterType: string;
  handlers: [PredicateFn, AnySourceTransformer][];
  transformerOutputSchema?: type.Any;
  fallback?: FallbackFn<any>;
}

export interface TestSourceAdapter<TParams extends TestBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerOutputSchema?: TParams["transformerOutputSchema"];
  fallback?: FallbackFn<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any
  >;
}

export type CreateAnySourceAdapter<
  TType extends string,
  TConfig extends {
    handlers: CreateSourceTransformer<any>[];
    transformerOutputSchema?: type.Any;
    fallback?: any;
  },
> = TestSourceAdapter<{
  adapterType: TType;
  handlers: Array<[PredicateFn, TConfig["handlers"][number]]>;
  transformerOutputSchema?: TConfig["transformerOutputSchema"];
  fallback?: FallbackFn<TConfig["handlers"][number]["output"]>;
}>;
