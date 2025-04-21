import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/shortcodes.ts",
    "./src/constants.ts",
  ],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  bundle: true,
});
