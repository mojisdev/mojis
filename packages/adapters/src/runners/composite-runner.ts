import type { Cache, CacheOptions } from "@mojis/internal-utils";
import type { AnyCompositeHandler } from "../builders/composite-builder/types";
import type { AdapterContext } from "../global-types";

export interface RunCompositeHandlerOverrides {
  cacheKey?: string;
  cacheOptions?: CacheOptions;
  cache?: Cache<string>;
}

export async function runCompositeHandler<THandler extends AnyCompositeHandler>(
  ctx: AdapterContext,
  handler: THandler,
  __overrides?: RunCompositeHandlerOverrides,
): Promise<THandler["output"]> {
  console.error("handler", handler);
  console.error("ctx", ctx);
  console.error("__overrides", __overrides);

  return Promise.resolve(undefined);
}
