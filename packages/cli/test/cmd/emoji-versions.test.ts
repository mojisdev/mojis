/* eslint-disable no-console */
import fs from "node:fs/promises";
import path from "node:path";
import * as versions from "@mojis/versions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import * as cliUtils from "../../src/cli-utils";
import { runEmojiVersions } from "../../src/cmd/emoji-versions";
import * as files from "../../src/files";

vi.mock("@mojis/versions", async () => {
  const actual = await vi.importActual("@mojis/versions");
  return {
    ...actual,
    getAllEmojiVersions: vi.fn(),
    getLatestEmojiVersion: vi.fn(),
  };
});

vi.mock("../../src/cli-utils", async () => {
  const actual = await vi.importActual("../../src/cli-utils");
  return {
    ...actual,
    printHelp: vi.fn(),
  };
});

vi.mock("../../src/files", async () => {
  const actual = await vi.importActual("../../src/files");
  return {
    ...actual,
    writeFileSafe: vi.fn(),
  };
});

const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

describe("emoji-versions command", () => {
  const mockEmojiVersions = [
    { emoji_version: "15.0", unicode_version: "", draft: false },
    { emoji_version: "15.1", unicode_version: "", draft: true },
    { emoji_version: "14.0", unicode_version: "", draft: false },
    { emoji_version: "14.5", unicode_version: "", draft: true },
  ];

  const mockLatestVersion = { emoji_version: "15.0", unicode_version: "", draft: false };
  const mockLatestVersionWithDrafts = { emoji_version: "15.1", unicode_version: "", draft: true };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(versions.getAllEmojiVersions).mockResolvedValue(mockEmojiVersions);
    vi.mocked(versions.getLatestEmojiVersion)
      .mockImplementation((versions, includeDrafts) =>
        includeDrafts ? mockLatestVersionWithDrafts : mockLatestVersion);
    console.log = vi.fn();
    console.info = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
  });

  describe("command validation", () => {
    it("should call printHelp for invalid subcommand", async () => {
      await runEmojiVersions("invalid", {
        flags: {
          _: ["invalid"],
          drafts: false,
          force: false,
        },
      });
      expect(cliUtils.printHelp).toHaveBeenCalled();
    });

    it("should call printHelp when help flag is provided", async () => {
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          help: true,
          drafts: false,
          force: false,
        },
      });
      expect(cliUtils.printHelp).toHaveBeenCalled();
    });

    it("should call printHelp when h flag is provided", async () => {
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          h: true,
          drafts: false,
          force: false,
        },
      });
      expect(cliUtils.printHelp).toHaveBeenCalled();
    });
  });

  describe("latest subcommand", () => {
    it("should output latest version in table format by default", async () => {
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalled();
      expect(vi.mocked(console.log).mock.calls[0]?.[0]).toContain("15.0");
    });

    it("should handle drafts flag", async () => {
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          drafts: true,
          force: false,
        },
      });
      expect(versions.getLatestEmojiVersion).toHaveBeenCalledWith(mockEmojiVersions, true);
      expect(console.log).toHaveBeenCalled();
      expect(vi.mocked(console.log).mock.calls[0]?.[0]).toContain("15.1");
    });

    it("should output in JSON format when specified", async () => {
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          format: "json",
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls[0]?.[0];
      expect(() => JSON.parse(output)).not.toThrow();
      expect(JSON.parse(output)).toEqual(mockLatestVersion);
    });

    it("should handle case when no versions are found", async () => {
      vi.mocked(versions.getLatestEmojiVersion).mockReturnValue(null);
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalledWith("No emoji versions found.");
    });
  });

  describe("all subcommand", () => {
    it("should output all non-draft versions by default", async () => {
      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls[0]?.[0];
      expect(output).toContain("15.0");
      expect(output).toContain("14.0");
      expect(output).not.toContain("15.1");
    });

    it("should include drafts when specified", async () => {
      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          drafts: true,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls[0]?.[0];
      expect(output).toContain("15.0");
      expect(output).toContain("15.1");
    });

    it("should output in JSON format when specified", async () => {
      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          format: "json",
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalled();
      const output = vi.mocked(console.log).mock.calls[0]?.[0];
      expect(() => JSON.parse(output)).not.toThrow();
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(2);
    });

    it("should handle empty results after filtering", async () => {
      vi.mocked(versions.getAllEmojiVersions).mockResolvedValue([
        {
          emoji_version: "15.1",
          unicode_version: "",
          draft: true,
        },
        {
          emoji_version: "14.5",
          unicode_version: "",
          draft: true,
        },
      ]);

      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          drafts: false,
          force: false,
        },
      });
      expect(console.log).toHaveBeenCalledWith("No emoji versions found.");
    });
  });

  describe("file output", () => {
    it("should write latest version to file in JSON format", async () => {
      const outputPath = "/mock/output.json";
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          output: outputPath,
          drafts: false,
          force: false,
        },
      });

      expect(files.writeFileSafe).toHaveBeenCalledWith(
        outputPath,
        JSON.stringify(mockLatestVersion, null, 2),
        { force: false, encoding: "utf-8" },
      );
      expect(console.info).toHaveBeenCalled();
    });

    it("should write all versions to file in JSON format", async () => {
      const outputPath = "/mock/output.json";
      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          output: outputPath,
          drafts: false,
          force: false,
        },
      });

      expect(files.writeFileSafe).toHaveBeenCalledWith(
        outputPath,
        JSON.stringify(mockEmojiVersions.filter((v) => !v.draft), null, 2),
        { force: false, encoding: "utf-8" },
      );
      expect(console.info).toHaveBeenCalled();
    });

    it("should respect force flag when writing to file", async () => {
      const outputPath = "/mock/output.json";
      await runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          drafts: false,
          output: outputPath,
          force: true,
        },
      });

      expect(files.writeFileSafe).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        { force: true, encoding: "utf-8" },
      );
    });

    it("should use vitest-testdirs for real file operations", async () => {
      const dir = await testdir({});
      const outputPath = path.join(dir, "emoji-versions.json");

      vi.mocked(files.writeFileSafe).mockImplementation(async (path, content, options) => {
        await fs.writeFile(path, content, { encoding: options?.encoding });
      });

      await runEmojiVersions("all", {
        flags: {
          _: ["all"],
          output: outputPath,
          drafts: true,
          force: false,
        },
      });

      const fileContent = await fs.readFile(outputPath, "utf-8");
      const parsed = JSON.parse(fileContent);
      expect(parsed).toEqual(mockEmojiVersions);
    });
  });

  describe("error handling", () => {
    it("should handle writeFileSafe errors", async () => {
      const outputPath = "/mock/output.json";
      const errorMessage = "Permission denied";
      vi.mocked(files.writeFileSafe).mockRejectedValue(new Error(errorMessage));

      await expect(runEmojiVersions("latest", {
        flags: {
          _: ["latest"],
          output: outputPath,
          drafts: false,
          force: false,
        },
      }))
        .rejects.toThrow(errorMessage);
    });
  });
});
