import process from "node:process";
import yargs from "yargs-parser";
import { resolveCommand, runCommand } from "./cli-utils";

const flags = yargs(process.argv, {
  configuration: {
    "parse-positional-numbers": false,
  },
  array: ["generators", "shortcode-providers"],
  boolean: ["force", "write-lockfile"],
  default: {
    "generators": ["metadata"],
    "shortcode-providers": ["github"],
  },
});

const cmd = resolveCommand(flags);
await runCommand(cmd, flags);
