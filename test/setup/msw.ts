import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
export { http } from "msw"

export const restHandlers = []

export const msw_server = setupServer(...restHandlers)

beforeAll(() => msw_server.listen({ onUnhandledRequest: "warn" }))
afterAll(() => msw_server.close())
afterEach(() => msw_server.resetHandlers())

