// @ts-check
import { luxass } from "@luxass/eslint-config";

export default luxass({
  type: "lib",
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
}, {
  files: ["!**/*.test.ts"],
  rules: {
    "no-restricted-globals": [
      "error",
      {
        name: "fetchMock",
        message: "using fetchMock in non-test files is not allowed",
      },
    ],
  },
});
