import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { writeFileSafe, writeJsonFile } from "../src/files";

describe("safe file writing", () => {
  it("should write a file", async () => {
    const testdirPath = await testdir({});

    await writeFileSafe(path.join(testdirPath, "test.txt"), "Hello, world!", { encoding: "utf-8" });

    const file = await fs.readFile(path.join(testdirPath, "test.txt"), "utf8");
    expect(file).toBe("Hello, world!");
  });

  it("should throw an error if the file already exists", async () => {
    const testdirPath = await testdir({
      "test.txt": "Hello, world!",
    });

    await expect(() => writeFileSafe(path.join(testdirPath, "test.txt"), "Hello, world!", { encoding: "utf-8" })).rejects.toThrow();
  });

  it("should force write a file", async () => {
    const testdirPath = await testdir({
      "test.txt": "Hello, world!",
    });

    await writeFileSafe(path.join(testdirPath, "test.txt"), "Hello, mojis!", { force: true, encoding: "utf-8" });

    const file = await fs.readFile(path.join(testdirPath, "test.txt"), "utf8");
    expect(file).toBe("Hello, mojis!");
  });

  it("should write a file with a custom encoding", async () => {
    const testdirPath = await testdir({});

    // eslint-disable-next-line node/prefer-global/buffer
    await writeFileSafe(path.join(testdirPath, "test.txt"), Buffer.from("Hello, world!").toString("hex"), { encoding: "hex" });

    const file = await fs.readFile(path.join(testdirPath, "test.txt"), "hex");
    expect(file).toBe("48656c6c6f2c20776f726c6421");
  });
});

describe("write json file", () => {
  it("should write a json file", async () => {
    const testdirPath = await testdir({});

    await writeJsonFile(path.join(testdirPath, "test.json"), { hello: "world" }, { encoding: "utf-8" });

    const file = await fs.readFile(path.join(testdirPath, "test.json"), "utf8");
    expect(file).toBe("{\n  \"hello\": \"world\"\n}");
  });

  it("should throw an error if the file already exists", async () => {
    const testdirPath = await testdir({
      "test.json": "{}",
    });

    await expect(() => writeJsonFile(path.join(testdirPath, "test.json"), { hello: "world" }, { encoding: "utf-8" })).rejects.toThrow();
  });

  it("should force write a json file", async () => {
    const testdirPath = await testdir({
      "test.json": "{}",
    });

    await writeJsonFile(path.join(testdirPath, "test.json"), { hello: "world" }, { force: true, encoding: "utf-8" });
  });
});
