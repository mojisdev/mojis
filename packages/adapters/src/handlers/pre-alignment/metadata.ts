import { defineAdapterHandler } from "../../define";

export const preAlignmentMetadataHandler = defineAdapterHandler({
  type: "metadata",
  shouldExecute: (ctx) => {
    return isBeforeAlignment(ctx.emoji_version);
  },
  urls: () => {
    return undefined;
  },
  parser: "generic",
  transform() {
    return undefined;
  },
  output() {
    return {
      groups: [],
      emojis: [],
    };
  },
});
