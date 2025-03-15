import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runCLI } from "../src/cli-utils";

const mockRunEmojiVersions = vi.fn();
const mockRunGenerate = vi.fn();

vi.mock("../src/cmd/emoji-versions", () => ({
  runEmojiVersions: mockRunEmojiVersions,
}));

vi.mock("../src/cmd/generate", () => ({
  runGenerate: mockRunGenerate,
}));

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new Error(`Process exit with code ${code}`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("should run the help command by default", async () => {
  const consoleLogSpy = vi.spyOn(console, "log");
  await runCLI(["node", "script.js"]);
  expect(consoleLogSpy).toHaveBeenCalled();
  expect(consoleLogSpy.mock.calls[0]?.[0]).toContain("mojis");
});

it("should run the version command when --version flag is provided", async () => {
  const consoleLogSpy = vi.spyOn(console, "log");
  await runCLI(["node", "script.js", "--version"]);
  expect(consoleLogSpy).toHaveBeenCalled();
  expect(consoleLogSpy.mock.calls[0]?.[0]).toContain("mojis");
  expect(consoleLogSpy.mock.calls[0]?.[0]).toContain("v");
});

it("should handle emoji-versions command", async () => {
  await runCLI(["node", "script.js", "emoji-versions"]);
  expect(mockRunEmojiVersions).toHaveBeenCalledWith("", expect.objectContaining({
    flags: expect.objectContaining({
      drafts: false,
      force: false,
    }),
  }));
});

it("should handle emoji-versions command with subcommand", async () => {
  await runCLI(["node", "script.js", "emoji-versions", "latest"]);

  expect(mockRunEmojiVersions).toHaveBeenCalledWith("latest", expect.objectContaining({
    flags: expect.objectContaining({
      drafts: false,
      force: false,
    }),
  }));
});

it("should handle emoji-versions command with drafts flag", async () => {
  await runCLI(["node", "script.js", "emoji-versions", "--drafts"]);
  expect(mockRunEmojiVersions).toHaveBeenCalledWith("", expect.objectContaining({
    flags: expect.objectContaining({
      drafts: true,
      force: false,
    }),
  }));
});

it("should handle generate command with versions", async () => {
  await runCLI(["node", "script.js", "generate", "15.0", "14.0"]);

  expect(mockRunGenerate).toHaveBeenCalledWith(expect.objectContaining({
    versions: ["15.0", "14.0"],
    flags: expect.objectContaining({
      force: false,
    }),
  }));
});

it("should handle generate command with custom generators", async () => {
  await runCLI(["node", "script.js", "generate", "--generators", "json", "ts"]);
  expect(mockRunGenerate).toHaveBeenCalledWith(expect.objectContaining({
    versions: [],
    flags: expect.objectContaining({
      generators: ["json", "ts"],
      force: false,
    }),
  }));
});

it("should handle generate command with custom shortcode providers", async () => {
  await runCLI(["node", "script.js", "generate", "--shortcode-providers", "github", "discord"]);
  expect(mockRunGenerate).toHaveBeenCalledWith(expect.objectContaining({
    versions: [],
    flags: expect.objectContaining({
      "shortcode-providers": ["github", "discord"],
      "force": false,
    }),
  }));
});

it("should handle force flag", async () => {
  await runCLI(["node", "script.js", "generate", "--force"]);
  expect(mockRunGenerate).toHaveBeenCalledWith(expect.objectContaining({
    flags: expect.objectContaining({
      force: true,
    }),
  }));
});

it("should call process.exit with code 1 when an error occurs", async () => {
  mockRunGenerate.mockRejectedValue(new Error("Test error"));

  await expect(runCLI(["node", "script.js", "generate"])).rejects.toThrow("Process exit with code 1");
  expect(console.error).toHaveBeenCalled();
});
