import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";
import { hasLockfile, readLockfile, writeLockfile } from "../src/lockfile";

vi.mock("fs-extra", {
  spy: true,
});

describe("readLockfile", () => {
  it("should read and parse the lockfile", async () => {
    const mockLockfile = {
      latest_version: "1.0.0",
      versions: [
        {
          emoji_version: "1.0.0",
          unicode_version: "1.0.0",
          draft: false,
          fallback: null,
        },
      ],
    };
    vi.mocked(fs.readJSON).mockResolvedValue(mockLockfile);

    const lockfile = await readLockfile();

    expect(fs.readJSON).toHaveBeenCalledWith(path.join(process.cwd(), "emojis.lock"));
    expect(lockfile).toEqual(mockLockfile);
  });

  it("should return the default lockfile if the file doesn't exist", async () => {
    vi.mocked(fs.readJSON).mockRejectedValue(new Error("File not found"));

    const lockfile = await readLockfile();

    expect(lockfile).toEqual({ versions: [], latest_version: null });
  });

  it("should throw an error if the lockfile contains invalid data", async () => {
    vi.mocked(fs.readJSON).mockResolvedValue({ invalid: "data" });

    await expect(readLockfile()).rejects.toThrowError();
  });

  it("should read lockfile from specified cwd", async () => {
    const mockLockfile = {
      latest_version: "1.0.0",
      versions: [
        {
          emoji_version: "1.0.0",
          unicode_version: "1.0.0",
          draft: false,
          fallback: null,
        },
      ],
    };

    const testdirPath = await testdir({
      "emojis.lock": JSON.stringify(mockLockfile),
    });

    vi.mocked(fs.readJSON).mockResolvedValue(mockLockfile);

    const lockfile = await readLockfile(testdirPath);

    expect(fs.readJSON).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"));
    expect(lockfile).toEqual(mockLockfile);
  });
});

describe("writeLockfile", () => {
  it("should write the lockfile to disk", async () => {
    const testdirPath = await testdir({});
    const mockLockfile = {
      latest_version: "1.0.0",
      versions: [
        {
          emoji_version: "1.0.0",
          unicode_version: "1.0.0",
          draft: false,
          fallback: null,
        },
      ],
    };

    await writeLockfile(mockLockfile, testdirPath);

    expect(fs.writeJSON).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"), mockLockfile, { spaces: 2 });
  });

  it("should throw an error if the lockfile is invalid", async () => {
    const mockLockfile = {
      latest_version: "1.0.0",
      versions: [
        {
          emoji_version: "1.0.0",
          unicode_version: "1.0.0",
          draft: "not a boolean",
          fallback: null,
        } as any,
      ],
    };

    await expect(writeLockfile(mockLockfile as any)).rejects.toThrowError("invalid lockfile");
  });
});

describe("hasLockfile", () => {
  it("should return true if the lockfile exists", async () => {
    const testdirPath = await testdir({
      "emojis.lock": JSON.stringify({}),
    });

    const exists = await hasLockfile(testdirPath);

    expect(fs.exists).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"));
    expect(exists).toBe(true);
  });

  it("should return false if the lockfile does not exist", async () => {
    const testdirPath = await testdir({});

    const exists = await hasLockfile(testdirPath);

    expect(fs.exists).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"));
    expect(exists).toBe(false);
  });

  it("should return true if the lockfile exists in default cwd", async () => {
    const testdirPath = await testdir({
      "emojis.lock": JSON.stringify({}),
    });

    vi.mocked(fs.exists).mockResolvedValue(true as any);

    const exists = await hasLockfile(testdirPath);

    expect(fs.exists).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"));
    expect(exists).toBe(true);
  });

  it("should return false if the lockfile does not exist in default cwd", async () => {
    const testdirPath = await testdir({});

    vi.mocked(fs.exists).mockResolvedValue(false as any);

    const exists = await hasLockfile(testdirPath);

    expect(fs.exists).toHaveBeenCalledWith(path.join(testdirPath, "emojis.lock"));
    expect(exists).toBe(false);
  });
});
