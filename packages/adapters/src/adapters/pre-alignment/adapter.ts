import { defineMojiAdapter } from "../../adapter";

export const preAlignmentAdapter = defineMojiAdapter({
  name: "pre-alignment",
  description: "adapter for pre version alignment (v1-v5)",
  range: ">1.0.0 <6.0.0",
  extend: "base",
});
