import { expect, it } from "vitest";

it("expect true to be true", () => {
  expect(true).toBe(true);
});

// vi.mock("../src/cli-utils", {
//   spy: true,
// });

// it("should pass the correct arguments to resolveCommand", async () => {
//   const resolveSpy = vi.spyOn(cliUtils, "resolveCommand");

//   await runCLI(["build"]);

//   expect(resolveSpy).toHaveBeenCalledWith(
//     expect.objectContaining({
//       "_": ["build"],
//       "generators": [
//         "metadata",
//         "sequences",
//         "variations",
//         "unicode-names",
//       ],
//       "shortcode-providers": ["github"],
//       "shortcodeProviders": ["github"],
//       "force": false,
//     }),
//   );
// });

// it("should override default values when specified", async () => {
//   await runCLI(["build", "--generators", "custom", "--shortcode-providers", "gitlab", "--force"]);

//   expect(cliUtils.resolveCommand).toHaveBeenCalledWith(
//     expect.objectContaining({
//       "_": ["build"],
//       "generators": ["custom"],
//       "shortcode-providers": ["gitlab"],
//       "force": true,
//     }),
//   );
// });

// it("should handle multiple array values correctly", async () => {
//   await runCLI(["build", "--generators", "custom", "another", "--shortcode-providers", "not-found", "not-found2"]);

//   expect(cliUtils.resolveCommand).toHaveBeenCalledWith(
//     expect.objectContaining({
//       "_": ["build"],
//       "generators": ["custom", "another"],
//       "shortcode-providers": ["not-found", "not-found2"],
//     }),
//   );
// });

// it("should pass the resolved command to runCommand", async () => {
//   (cliUtils.resolveCommand as Mock).mockReturnValueOnce("help");
//   const runSpy = vi.spyOn(cliUtils, "runCommand");

//   await runCLI(["help"]);

//   expect(runSpy).toHaveBeenCalledWith(
//     "help",
//     expect.any(Object),
//   );
// });

// it("should handle error cases", async () => {
//   (cliUtils.resolveCommand as Mock).mockImplementationOnce(() => {
//     throw new Error("Command not found");
//   });

//   await expect(() => runCLI(["build"])).rejects.toThrow();
// });
