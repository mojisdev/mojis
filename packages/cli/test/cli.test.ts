import type { Mock } from "vitest";
import { expect, it, vi } from "vitest";
import { cli } from "../src/cli";
import * as cliUtils from "../src/cli-utils";

vi.mock("../src/cli-utils", {
  spy: true,
});

it("should pass the correct arguments to resolveCommand", async () => {
  const resolveSpy = vi.spyOn(cliUtils, "resolveCommand");

  await cli(["build"]);

  expect(resolveSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      "_": ["build"],
      "generators": [
        "metadata",
        "sequences",
        "variations",
        "unicode-names",
      ],
      "shortcode-providers": ["github"],
      "shortcodeProviders": ["github"],
      "force": false,
    }),
  );
});

it("should override default values when specified", async () => {
  await cli(["build", "--generators", "custom", "--shortcode-providers", "gitlab", "--force"]);

  expect(cliUtils.resolveCommand).toHaveBeenCalledWith(
    expect.objectContaining({
      "_": ["build"],
      "generators": ["custom"],
      "shortcode-providers": ["gitlab"],
      "force": true,
    }),
  );
});

it("should handle multiple array values correctly", async () => {
  await cli(["build", "--generators", "custom", "another", "--shortcode-providers", "not-found", "not-found2"]);

  expect(cliUtils.resolveCommand).toHaveBeenCalledWith(
    expect.objectContaining({
      "_": ["build"],
      "generators": ["custom", "another"],
      "shortcode-providers": ["not-found", "not-found2"],
    }),
  );
});

it("should pass the resolved command to runCommand", async () => {
  (cliUtils.resolveCommand as Mock).mockReturnValueOnce("help");
  const runSpy = vi.spyOn(cliUtils, "runCommand");

  await cli(["help"]);

  expect(runSpy).toHaveBeenCalledWith(
    "help",
    expect.any(Object),
  );
});

it("should handle error cases", async () => {
  (cliUtils.resolveCommand as Mock).mockImplementationOnce(() => {
    throw new Error("Command not found");
  });

  await expect(() => cli(["build"])).rejects.toThrow();
});
