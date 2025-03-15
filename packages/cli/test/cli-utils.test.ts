import type { Arguments } from "yargs-parser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { parseFlags, resolveCommand, runCommand } from "../src/cli-utils";
import { DEFAULT_GENERATORS, DEFAULT_SHORTCODE_PROVIDERS } from "../src/constants";

const mockRunEmojiVersions = vi.fn();
const mockRunGenerate = vi.fn();

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

describe("parseFlags", () => {
  it("should parse array flags correctly", () => {
    const args = ["--generators", "gen1", "gen2", "--shortcode-providers", "prov1", "prov2"];
    const flags = parseFlags(args);
    expect(flags.generators).toEqual(["gen1", "gen2"]);
    expect(flags["shortcode-providers"]).toEqual(["prov1", "prov2"]);
  });

  it("should parse boolean flags correctly", () => {
    const args = ["--force", "--drafts"];
    const flags = parseFlags(args);
    expect(flags.force).toBe(true);
    expect(flags.drafts).toBe(true);
  });

  it("should use default values when flags are not provided", () => {
    const flags = parseFlags([]);
    expect(flags.generators).toEqual(DEFAULT_GENERATORS);
    expect(flags["shortcode-providers"]).toEqual(DEFAULT_SHORTCODE_PROVIDERS);
    expect(flags.force).toBe(false);
  });

  it("should not parse positional arguments as numbers", () => {
    const args = ["123", "456"];
    const flags = parseFlags(args);
    expect(flags._).toEqual(["123", "456"]);
  });

  it("should allow overriding default values", () => {
    const args = [
      "--generators",
      "custom-gen",
      "--shortcode-providers",
      "custom-prov",
      "--force",
    ];
    const flags = parseFlags(args);
    expect(flags.generators).toEqual(["custom-gen"]);
    expect(flags["shortcode-providers"]).toEqual(["custom-prov"]);
    expect(flags.force).toBe(true);
  });
});

describe("runCommand", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should print help message for 'help' command", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    await runCommand("help", { _: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("The CLI for managing emoji data"),
    );
  });

  it("should print version for 'version' command", async () => {
    const consoleSpy = vi.spyOn(console, "log");
    await runCommand("version", { _: [] });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`v${pkg.version}`),
    );
  });

  it("should handle 'emoji-versions' command", async () => {
    vi.mock("../src/cmd/emoji-versions", () => ({
      runEmojiVersions: mockRunEmojiVersions,
    }));

    const flags = { _: ["", "", "emoji-versions", "subcommand"], drafts: true, force: true };
    await runCommand("emoji-versions", flags);

    expect(mockRunEmojiVersions).toHaveBeenCalledWith(
      "subcommand",
      expect.objectContaining({
        flags: expect.objectContaining({
          drafts: true,
          force: true,
        }),
      }),
    );
  });

  it("should handle 'emoji-versions' command with no subcommand", async () => {
    const flags = { _: ["", "", "emoji-versions"], drafts: false, force: false };
    await runCommand("emoji-versions", flags);
    vi.mock("../src/cmd/emoji-versions", () => ({
      runEmojiVersions: mockRunEmojiVersions,
    }));

    expect(mockRunEmojiVersions).toHaveBeenCalledWith(
      "",
      expect.objectContaining({
        flags: expect.objectContaining({
          drafts: false,
          force: false,
        }),
      }),
    );
  });

  it("should handle 'generate' command", async () => {
    vi.mock("../src/cmd/generate", () => ({
      runGenerate: mockRunGenerate,
    }));

    const flags = {
      "_": ["", "", "generate", "15.0", "15.1"],
      "generators": ["gen1", "gen2"],
      "shortcode-providers": ["prov1", "prov2"],
      "force": true,
    };
    await runCommand("generate", flags);

    expect(mockRunGenerate).toHaveBeenCalledWith({
      versions: ["15.0", "15.1"],
      flags: expect.objectContaining({
        "generators": ["gen1", "gen2"],
        "shortcode-providers": ["prov1", "prov2"],
        "force": true,
      }),
    });
  });

  it("should throw error for unknown command", async () => {
    // @ts-expect-error Testing invalid command
    await expect(runCommand("invalid", { _: [] })).rejects.toThrow(
      "Error running invalid -- no command found.",
    );
  });
});
