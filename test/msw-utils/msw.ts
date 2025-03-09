import { http, type HttpResponseResolver } from "msw";
import { setupServer } from "msw/node";

export const restHandlers = []

export const msw_server = setupServer(...restHandlers)


type Method = "get" | "post" | "put" | "delete" | "patch" | "head" | "options"

export function mockFetch(url: string, method: Method, resolver: HttpResponseResolver) {
  msw_server.use(
    http[method](url, resolver)
  )
}

export { http };
