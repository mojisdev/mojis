import { z } from "zod";
import { createAdapterHandlerBuilder } from "../builder";

const MAPPINGS = {
  "1.0": "https://unicode-proxy.mojis.dev/proxy/1.1-Update/UnicodeData-1.1.5.txt",
  "2.0": "https://unicode-proxy.mojis.dev/proxy/2.0-Update/UnicodeData-2.0.14.txt",
  "3.0": "https://unicode-proxy.mojis.dev/proxy/3.0-Update1/UnicodeData-3.0.1.txt",
  "4.0": "https://unicode-proxy.mojis.dev/proxy/4.0-Update1/UnicodeData-4.0.1.txt",
  "13.1": "https://unicode-proxy.mojis.dev/proxy/13.0.0/ucd/UnicodeData.txt",
} as Record<string, string>;

const builder = createAdapterHandlerBuilder({
  type: "unicode-names",
});

export const handler = builder
  .onVersion(
    () => true,
    (builder) => builder
      .validation(z.record(z.string(), z.string()))
      .urls((ctx) => {
        return {
          url: MAPPINGS[ctx.emoji_version] || `https://unicode-proxy.mojis.dev/proxy/${ctx.emoji_version}.0/ucd/UnicodeData.txt`,
          cacheKey: `v${ctx.emoji_version}/unicode-names`,
        };
      })
      .parser("generic", {
        separator: ";",
      })
      .transform((_, data) => {
        const result: Record<string, string> = {};

        for (const line of data.lines) {
          const [hexcode, name] = line.fields;

          if (hexcode == null || name == null) {
            throw new Error(`Invalid line: ${line}`);
          }

          result[hexcode] = name;
        }

        return result;
      })
      .output((_, transformed) => {
        //          ^?
        return transformed;
      }),
  ).build();
