import { defineAdapterHandler } from "../define";

export const unicodeNamesHandler = defineAdapterHandler({
  type: "unicode-names",
  shouldExecute: true,
  parser: "generic",
  parserOptions: {
    separator: ";",
  },
  urls: ({ emoji_version }) => {
    return `https://unicode.org/Public/${emoji_version}.0/ucd/UnicodeData.txt`;
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
