import { join } from "node:path";
import { type } from "arktype";
import { createSourceAdapter } from "../../builders/source-builder/builder";

const MAPPINGS = {
  "1.0": "https://unicode-proxy.mojis.dev/proxy/1.1-Update/UnicodeData-1.1.5.txt",
  "2.0": "https://unicode-proxy.mojis.dev/proxy/2.0-Update/UnicodeData-2.0.14.txt",
  "3.0": "https://unicode-proxy.mojis.dev/proxy/3.0-Update1/UnicodeData-3.0.1.txt",
  "4.0": "https://unicode-proxy.mojis.dev/proxy/4.0-Update1/UnicodeData-4.0.1.txt",
  "13.1": "https://unicode-proxy.mojis.dev/proxy/13.0.0/ucd/UnicodeData.txt",
} as Record<string, string>;

const builder = createSourceAdapter({
  type: "unicode-names",
  transformerOutputSchema: type({
    "[string]": "string",
  }),
  persistenceOutputSchema: type({
    "[string]": "string",
  }),
});

export const handler = builder
  .withTransform(
    () => true,
    (builder) => builder
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
  )
  .fallback(() => {
    return {};
  })
  .persistence((data, opts) => {
    return [
      {
        filePath: join(opts.basePath, "unicode-names.json"),
        data,
        type: "json" as const,
      },
    ];
  })
  .build();
