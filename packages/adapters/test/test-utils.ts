/* eslint-disable ts/explicit-function-return-type */
import type { PredicateFn } from "../src/adapter-builder/types";
import type { AdapterHandlerType } from "../src/global-types";
import type { AnyVersionHandler } from "../src/version-builder/types";
import { vi } from "vitest";

export function createMockHandlers() {
  return {
    metadata: {
      adapterType: "metadata",
      handlers: [] as [PredicateFn, AnyVersionHandler][],
    },
    sequences: {
      adapterType: "sequences",
      handlers: [] as [PredicateFn, AnyVersionHandler][],
    },
    unicodeNames: {
      adapterType: "unicode-names",
      handlers: [] as [PredicateFn, AnyVersionHandler][],
    },
    variations: {
      adapterType: "variations",
      handlers: [] as [PredicateFn, AnyVersionHandler][],
    },
  } as const;
}

export async function setupAdapterTest() {
  const mockHandlers = createMockHandlers();

  // mock needs to be before the dynamic import
  vi.doMock("../src/handlers", () => mockHandlers);

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runAdapterHandler } = await import("../src/index");

  return {
    runAdapterHandler,
    mockHandlers,
  };
}

export function addHandlerToMock(
  mockHandlers: ReturnType<typeof createMockHandlers>,
  type: AdapterHandlerType,
  versionPredicate: (version: string) => boolean,
  handler: AnyVersionHandler,
): void {
  let _type: string = type;
  if (type === "unicode-names") {
    _type = "unicodeNames";
  }

  mockHandlers[_type as keyof typeof mockHandlers].handlers.push([versionPredicate, handler]);
}

export function cleanupAdapterTest(): void {
  vi.resetModules();
  vi.clearAllMocks();
}
