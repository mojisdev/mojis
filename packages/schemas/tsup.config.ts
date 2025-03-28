import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "./src/index.ts",
    "./src/emojis.ts",
  ],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  bundle: true,
});
