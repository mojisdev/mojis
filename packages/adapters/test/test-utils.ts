/* eslint-disable ts/explicit-function-return-type */
import type { Cache } from "@mojis/internal-utils";
import type { z } from "zod";
import type { AnyAdapterHandler, FallbackFn, PredicateFn } from "../src/adapter-builder/types";
import type { AdapterHandlerType } from "../src/global-types";
import type { HANDLERS } from "../src/index";
import type { AnyVersionHandler } from "../src/version-builder/types";
import { createCache } from "@mojis/internal-utils";
import { vi } from "vitest";

type ORIGINAL_HANDLERS = Awaited<typeof import("../src/handlers/index")>;

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
    metadata: {
      adapterType: "metadata",
      // @ts-expect-error - we don't need to provide a handler for the metadata adapter
      handlers: [],
    },
    sequences: {
      adapterType: "sequences",
      // @ts-expect-error - we don't need to provide a handler for the sequences adapter
      handlers: [],
    },
    unicodeNames: {
      adapterType: "unicode-names",
      // @ts-expect-error - we don't need to provide a handler for the unicode-names adapter
      handlers: [],
    },
    variations: {
      adapterType: "variations",
      // @ts-expect-error - we don't need to provide a handler for the variations adapter
      handlers: [],
    },
  };
}

export interface AddHandlerToMockOptions<TOutputSchema extends z.ZodType> {
  outputSchema?: TOutputSchema;
  predicate: PredicateFn;
  handler: AnyVersionHandler;
  fallback?: FallbackFn<TOutputSchema["_input"]>;
}

export interface SetupAdapterTestOptions {
  cache?: Cache<string>;
}

export async function setupAdapterTest<TOutputSchema extends z.ZodType>(options?: SetupAdapterTestOptions) {
  const mockHandlers = createMockHandlers();

  const cache = options?.cache ?? createCache<string>({ store: "memory" });

  // mock needs to be before the dynamic import
  vi.doMock("../src/handlers", () => mockHandlers);

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runAdapterHandler: runAdapterHandlerOriginal } = await import("../src/index");

  function addHandlerToMock(
    type: AdapterHandlerType,
    opts: AddHandlerToMockOptions<TOutputSchema>,
  ) {
    let _type: string = type;
    if (type === "unicode-names") {
      _type = "unicodeNames";
    }
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

  function runAdapterHandler<
    TAdapterHandlerType extends AdapterHandlerType,
    THandler extends AnyAdapterHandler = typeof HANDLERS[TAdapterHandlerType],
  >(...args: Parameters<typeof runAdapterHandlerOriginal<TAdapterHandlerType, THandler>>) {
    const [type, ctx, opts] = args;
    return runAdapterHandlerOriginal<TAdapterHandlerType, THandler>(type, ctx, {
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
