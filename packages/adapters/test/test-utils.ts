/* eslint-disable ts/explicit-function-return-type */
import type { z } from "zod";
import type { FallbackFn, PredicateFn } from "../src/adapter-builder/types";
import type { AdapterHandlerType } from "../src/global-types";
import type { AnyVersionHandler } from "../src/version-builder/types";
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
      handlers: [],
    },
    sequences: {
      adapterType: "sequences",
      handlers: [],
    },
    unicodeNames: {
      adapterType: "unicode-names",
      handlers: [],
    },
    variations: {
      adapterType: "variations",
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

export async function setupAdapterTest<TOutputSchema extends z.ZodType>() {
  const mockHandlers = createMockHandlers();

  // mock needs to be before the dynamic import
  vi.doMock("../src/handlers", () => mockHandlers);

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runAdapterHandler } = await import("../src/index");

  function addHandlerToMock(
    type: AdapterHandlerType,
    opts: AddHandlerToMockOptions<TOutputSchema>,
  ) {
    let _type: string = type;
    if (type === "unicode-names") {
      _type = "unicodeNames";
    }

    if (opts.outputSchema != null) {
      mockHandlers[_type as keyof typeof mockHandlers].outputSchema = opts.outputSchema;
    }

    if (opts.fallback != null) {
      mockHandlers[_type as keyof typeof mockHandlers].fallback = opts.fallback;
    }

    mockHandlers[_type as keyof typeof mockHandlers].handlers.push([
      opts.predicate,
      opts.handler,
    ]);
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
