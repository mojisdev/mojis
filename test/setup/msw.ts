import { afterAll, afterEach, beforeAll } from "vitest";
import { msw_server } from "../msw-utils/msw";

beforeAll(() => msw_server.listen({ onUnhandledRequest: "warn" }));
afterAll(() => msw_server.close());
afterEach(() => msw_server.resetHandlers());
