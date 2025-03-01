import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cache from "../src/cache";
import { generateGitHubShortcodes } from "../src/shortcodes";

vi.mock("../src/cache", () => ({
  fetchCache: vi.fn(),
}));

describe("generateGitHubShortcodes", () => {
  const mockEmojis = new Map([
    ["1F600", "grinning"],
    ["1F604", "smile"],
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate GitHub shortcodes correctly", async () => {
    vi.mocked(cache.fetchCache).mockResolvedValueOnce({
      grinning: "https://github.githubassets.com/images/icons/emoji/unicode/1f600.png",
      smile: "https://github.githubassets.com/images/icons/emoji/unicode/1f604.png",
    });

    const result = await generateGitHubShortcodes({
      emojis: mockEmojis,
      force: false,
    });

    expect(result).toEqual([
      { code: "grinning", vendor: "github", source: "github" },
      { code: "smile", vendor: "github", source: "github" },
    ]);

    expect(cache.fetchCache).toHaveBeenCalledWith(
      "https://github-emojis.luxass.dev/api/v1/emojis",
      expect.objectContaining({
        cacheKey: "github-emojis.json",
        bypassCache: false,
      }),
    );
  });

  it("should skip emojis without unicode representation", async () => {
    vi.mocked(cache.fetchCache).mockResolvedValueOnce({
      octocat: "https://github.githubassets.com/images/icons/emoji/octocat.png",
      smile: "https://github.githubassets.com/images/icons/emoji/unicode/1f604.png",
    });

    const result = await generateGitHubShortcodes({
      emojis: mockEmojis,
      force: false,
    });

    expect(result).toEqual([
      { code: "smile", vendor: "github", source: "github" },
    ]);
  });

  it("should skip emojis not in emoji map", async () => {
    vi.mocked(cache.fetchCache).mockResolvedValueOnce({
      unknown: "https://github.githubassets.com/images/icons/emoji/unicode/1f999.png",
      smile: "https://github.githubassets.com/images/icons/emoji/unicode/1f604.png",
    });

    const result = await generateGitHubShortcodes({
      emojis: mockEmojis,
      force: false,
    });

    expect(result).toEqual([
      { code: "smile", vendor: "github", source: "github" },
    ]);
  });
});
