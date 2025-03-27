/* eslint-disable ts/explicit-function-return-type */
import type { AdapterHandlerType, AnyAdapterHandler } from "../src/types";
import { vi } from "vitest";

export function createMockHandlers() {
  return {
    metadata: {
      adapterType: "metadata",
      handlers: [] as AnyAdapterHandler[],
    },
    sequences: {
      adapterType: "sequences",
      handlers: [] as AnyAdapterHandler[],
    },
    unicodeNames: {
      adapterType: "unicode-names",
      handlers: [] as AnyAdapterHandler[],
    },
    variations: {
      adapterType: "variations",
      handlers: [] as AnyAdapterHandler[],
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
  mockHandlers: any,
  type: AdapterHandlerType,
  versionPredicate: (version: string) => boolean,
  handler: any,
): void {
  mockHandlers[type].handlers.push([versionPredicate, handler]);
}

export function cleanupAdapterTest(): void {
  vi.resetModules();
  vi.clearAllMocks();
}
