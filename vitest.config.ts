import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "vitest/config";

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

const hiddenLogs = [
  "[shortcodes]",
  "[versions]",
]

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["**/src/**"],
    },
    setupFiles: [
      "./test/setup/msw.ts"
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    workspace: [
      {
        extends: true,
        test: {
          include: ["./packages/internal-utils/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "internal-utils",
          environment: "node",
          mockReset: true,
          typecheck: {
            checker: "tsc",
            enabled: true,
            include: ["./packages/internal-utils/**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            tsconfig: "./packages/internal-utils/tsconfig.test.json"
          }
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: [
            "./packages/adapters/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "adapters",
          environment: "node",
          mockReset: true,
          typecheck: {
            checker: "tsc",
            enabled: true,
            include: ["./packages/adapters/**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            tsconfig: "./packages/adapters/tsconfig.test.json"
          }
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/cli/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "cli",
          environment: "node",
          mockReset: true,
          typecheck: {
            checker: "tsc",
            enabled: true,
            include: ["./packages/cli/**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            tsconfig: "./packages/cli/tsconfig.test.json"
          }
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/parsers/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "parsers",
          environment: "node",
          mockReset: true,
          typecheck: {
            checker: "tsc",
            enabled: true,
            include: ["./packages/parsers/**/*.{test,spec}-d.?(c|m)[jt]s?(x)"],
            tsconfig: "./packages/parsers/tsconfig.test.json"
          }
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      }
    ]
  }
})
