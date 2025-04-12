/* eslint-disable ts/explicit-function-return-type */
import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { GenericParseOptions } from "@mojis/parsers";
import type { type } from "arktype";
import type { FallbackFn, PredicateFn } from "../src/builders/adapter-builder/types";
import type { AnyVersionHandler, VersionHandler } from "../src/builders/version-builder/types";
import type {
  AdapterContext,
  AdapterHandlerType,
  BuiltinParser,
  PossibleUrls,
} from "../src/global-types";
import { createCache } from "@mojis/internal-utils";
import { vi } from "vitest";

type ORIGINAL_HANDLERS = Awaited<typeof import("../src/handlers/adapter/index")>;

type HANDLER_MAP = {
  [K in keyof ORIGINAL_HANDLERS]: {
    adapterType: ORIGINAL_HANDLERS[K]["adapterType"];
    outputSchema?: ORIGINAL_HANDLERS[K]["outputSchema"];
    handlers: ORIGINAL_HANDLERS[K]["handlers"];
    fallback?: ORIGINAL_HANDLERS[K]["fallback"];
  };
};

export function createMockHandlers(): HANDLER_MAP {
  return {
    metadataHandler: {
      adapterType: "metadata",
      // @ts-expect-error - we don't need to provide a handler for the metadata adapter
      handlers: [],
    },
    sequencesHandler: {
      adapterType: "sequences",
      // @ts-expect-error - we don't need to provide a handler for the sequences adapter
      handlers: [],
    },
    unicodeNamesHandler: {
      adapterType: "unicode-names",
      // @ts-expect-error - we don't need to provide a handler for the unicode names adapter
      handlers: [],
    },
    variationsHandler: {
      adapterType: "variations",
      // @ts-expect-error - we don't need to provide a handler for the variations adapter
      handlers: [],
    },
  };
}

export interface AddHandlerToMockOptions<TOutputSchema extends type.Any> {
  outputSchema?: TOutputSchema;
  predicate: PredicateFn;
  handler: AnyVersionHandler;
  fallback?: FallbackFn<TOutputSchema["infer"]>;
}

export interface SetupAdapterTestOptions {
  cache?: Cache<string>;
}

export async function setupAdapterTest<TOutputSchema extends type.Any>(options?: SetupAdapterTestOptions) {
  const mockHandlers = createMockHandlers();

  const cache = options?.cache ?? createCache<string>({ store: "memory" });

  // mock needs to be before the dynamic import
  vi.doMock("../src/handlers/adapter", () => mockHandlers);

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runAdapterHandler: runAdapterHandlerOriginal } = await import("../src/index");

  function normalizeHandlerName(type: AdapterHandlerType) {
    if (type === "metadata") {
      return "metadataHandler";
    }

    if (type === "sequences") {
      return "sequencesHandler";
    }

    if (type === "unicode-names") {
      return "unicodeNamesHandler";
    }

    if (type === "variations") {
      return "variationsHandler";
    }

    return type;
  }

  function addHandlerToMock(
    type: AdapterHandlerType,
    opts: AddHandlerToMockOptions<TOutputSchema>,
  ) {
    const _type = normalizeHandlerName(type);
    const handlerKey = _type as keyof typeof mockHandlers;

    if (opts.outputSchema != null) {
      mockHandlers[handlerKey].outputSchema = opts.outputSchema as any;
    }

    if (opts.fallback != null) {
      mockHandlers[handlerKey].fallback = opts.fallback;
    }

    mockHandlers[handlerKey].handlers.push([
      // @ts-expect-error - types are not matching, will fix later
      opts.predicate,
      // @ts-expect-error - types are not matching, will fix later
      opts.handler,
    ]);
  }

  function runAdapterHandler<TAdapterHandlerType extends AdapterHandlerType>(
    ...args: Parameters<typeof runAdapterHandlerOriginal<TAdapterHandlerType>>
  ) {
    const [type, ctx, opts] = args;
    return runAdapterHandlerOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
    });
  }

  return {
    runAdapterHandler,
    mockHandlers,
    addHandlerToMock,
  };
}

export function cleanupAdapterTest(): void {
  vi.resetModules();
  vi.clearAllMocks();
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
