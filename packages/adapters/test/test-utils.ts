/* eslint-disable ts/explicit-function-return-type */
import type { Cache } from "@mojis/internal-utils";
import type { type } from "arktype";
import type { FallbackFn, PredicateFn } from "../src/builders/adapter-builder/types";
import type { AnyVersionHandler } from "../src/builders/version-builder/types";
import type { AdapterHandlerType } from "../src/global-types";
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

    if (opts.outputSchema != null) {
      mockHandlers[_type as keyof typeof mockHandlers].outputSchema = opts.outputSchema as any;
    }

    if (opts.fallback != null) {
      mockHandlers[_type as keyof typeof mockHandlers].fallback = opts.fallback;
    }

    mockHandlers[_type as keyof typeof mockHandlers].handlers.push([
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
