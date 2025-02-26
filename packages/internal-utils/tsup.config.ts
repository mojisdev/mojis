import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/schemas.ts",
    "./src/shortcodes.ts",
  ],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  bundle: true,
});
