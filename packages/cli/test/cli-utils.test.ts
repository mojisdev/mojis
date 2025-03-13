import type { Arguments } from "yargs-parser";
import { describe, expect, it } from "vitest";
import { resolveCommand } from "../src/cli-utils";

describe("resolveCommand", () => {
  it("should return 'version' when version flag is present", () => {
    const flags: Arguments = { _: [], version: true };
    expect(resolveCommand(flags)).toBe("version");
  });

  it("should return the command from the third positional argument if it is supported", () => {
    const flags: Arguments = { _: ["", "", "generate"], version: false };
    expect(resolveCommand(flags)).toBe("generate");
  });

  it("should return 'help' when the third positional argument is not a supported command", () => {
    const flags: Arguments = { _: ["", "", "unknown"], version: false };
    expect(resolveCommand(flags)).toBe("help");
  });

  it("should return 'help' when there is no third positional argument", () => {
    const flags: Arguments = { _: [], version: false };
    expect(resolveCommand(flags)).toBe("help");
  });
});
