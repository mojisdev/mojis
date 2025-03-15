import { defineAdapterHandler } from "../define";

const MAPPINGS = {
  "1.0": "https://unicode-proxy.mojis.dev/proxy/1.1-Update/UnicodeData-1.1.5.txt",
  "2.0": "https://unicode-proxy.mojis.dev/proxy/2.0-Update/UnicodeData-2.0.14.txt",
  "3.0": "https://unicode-proxy.mojis.dev/proxy/3.0-Update1/UnicodeData-3.0.1.txt",
  "4.0": "https://unicode-proxy.mojis.dev/proxy/4.0-Update1/UnicodeData-4.0.1.txt",
  "13.1": "https://unicode-proxy.mojis.dev/proxy/13.0.0/ucd/UnicodeData.txt",
} as Record<string, string>;

export const unicodeNamesHandler = defineAdapterHandler({
  type: "unicode-names",
  shouldExecute: true,
  parser: "generic",
  parserOptions: {
    separator: ";",
  },
  urls: ({ emoji_version }) => {
    return MAPPINGS[emoji_version] || `https://unicode-proxy.mojis.dev/proxy/${emoji_version}.0/ucd/UnicodeData.txt`;
  },
  transform: (_, data) => {
    const result: Record<string, string> = {};

    for (const line of data.lines) {
      const [hexcode, name] = line.fields;

      if (hexcode == null || name == null) {
        throw new Error(`Invalid line: ${line}`);
      }

      result[hexcode] = name;
    }

    return result;
  },
  output: (_, transformed) => {
    return transformed;
  },
});
