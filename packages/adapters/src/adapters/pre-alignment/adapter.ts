import { defineMojiAdapter } from "../../define";

export const preAlignmentAdapter = defineMojiAdapter({
  name: "pre-alignment",
  description: "adapter for before the alignment with unicode versions",
  range: "1.x>= <6.x.x",
  extend: "base",
});
