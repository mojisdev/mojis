import { defineMojiAdapter } from "../../define-adapter";

export const modernAdapter = defineMojiAdapter({
  name: "modern",
  description: "adapter for the modern emoji versions",
  range: ">15.0.0",
  extend: "base",
});
