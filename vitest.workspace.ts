import { existsSync, readdirSync } from "node:fs";
import { defineWorkspace } from "vitest/config";

const pkgRoot = (pkg: string) =>
  new URL(`./packages/${pkg}`, import.meta.url).pathname;
const alias = (pkg: string) => `${pkgRoot(pkg)}/src`;

const aliases = readdirSync(new URL("./packages", import.meta.url).pathname)
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .reduce<Record<string, string>>(
    (acc, pkg) => {
      acc[`@mojis/${pkg}`] = alias(pkg);
      return acc;
    },
    {});

export default defineWorkspace([
  {
    test: {
      name: "unit",
      include: [
        "**/*.test.{ts,tsx}",
      ],
      environment: "node",
      mockReset: true,
      setupFiles: [
        "./test/setup/fetch-mock.ts",
      ]
    },
    esbuild: { target: "es2020" },
    resolve: { alias: aliases },
  },
]);
