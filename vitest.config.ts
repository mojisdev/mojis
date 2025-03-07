import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config'

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


export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["**/src/**"],
    },
    setupFiles: [
      "./test/setup/fetch-mock.ts"
    ],
    workspace: [
      {
        extends: true,
        test: {
          include: ["./packages/internal-utils/**/*.test.{ts,js}"],
          name: "internal-utils",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/adapters/**/*.test.{ts,js}"],
          name: "adapters",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/cli/**/*.test.{ts,js}"],
          name: "cli",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/parsers/**/*.test.{ts,js}"],
          name: "parsers",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      }
    ]
  }
})
