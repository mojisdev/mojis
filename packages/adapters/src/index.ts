import type { AdapterContext, AdapterHandler } from "./types";
import { getHandlerUrls } from "./utils";

export async function runAdapterHandler(handler: AdapterHandler, ctx: AdapterContext) {
  for (const [predicate, versionHandler] of handler.versionHandlers) {
    if (!predicate(ctx.emoji_version)) {
      continue;
    }

    const urls = await getHandlerUrls(versionHandler.urls(ctx), ctx);
  }
}
