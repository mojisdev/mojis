import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { emojiTest } from "@mojis/loomicode";
import { describe, expect, it } from "vitest";
import { metadataHandler } from "../../../src/handlers/adapter";
import { setupAdapterTest } from "../../__utils";

describe("metadata adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: true,
  };

  it("should handle basic emoji metadata", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockEmojiTest = emojiTest.smileys({
      separator: ";",
      commentPrefix: "#",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    const result = await runSourceAdapter(metadataHandler, mockContext);
    expect(result).toEqual({
      groups: [
        {
          name: "Smileys & Emotion",
          slug: "smileys-emotion",
          subgroups: ["face-smiling"],
        },
      ],
      emojis: {
        "smileys-emotion-face-smiling": {
          "1F600": {
            group: "smileys-emotion",
            subgroup: "face-smiling",
            qualifier: "fully-qualified",
            emojiVersion: "1.0",
            unicodeVersion: "8.0",
            description: "grinning face",
            emoji: "😀",
            hexcodes: ["1F600"],
          },
          "1F601": {
            group: "smileys-emotion",
            subgroup: "face-smiling",
            qualifier: "fully-qualified",
            emojiVersion: "0.6",
            unicodeVersion: "6.0",
            description: "beaming face with smiling eyes",
            emoji: "😁",
            hexcodes: ["1F601"],
          },
          "1F602": {
            description: "face with tears of joy",
            emoji: "😂",
            emojiVersion: "0.6",
            group: "smileys-emotion",
            hexcodes: [
              "1F602",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "6.0",
          },
          "1F603": {
            description: "grinning face with big eyes",
            emoji: "😃",
            emojiVersion: "0.6",
            group: "smileys-emotion",
            hexcodes: [
              "1F603",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "6.0",
          },
          "1F604": {
            description: "grinning face with smiling eyes",
            emoji: "😄",
            emojiVersion: "0.6",
            group: "smileys-emotion",
            hexcodes: [
              "1F604",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "6.0",
          },
          "1F605": {
            description: "grinning face with sweat",
            emoji: "😅",
            emojiVersion: "0.6",
            group: "smileys-emotion",
            hexcodes: [
              "1F605",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "6.0",
          },
          "1F606": {
            description: "grinning squinting face",
            emoji: "😆",
            emojiVersion: "0.6",
            group: "smileys-emotion",
            hexcodes: [
              "1F606",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "6.0",
          },
          "1F923": {
            description: "rolling on the floor laughing",
            emoji: "🤣",
            emojiVersion: "3.0",
            group: "smileys-emotion",
            hexcodes: [
              "1F923",
            ],
            qualifier: "fully-qualified",
            subgroup: "face-smiling",
            unicodeVersion: "9.0",
          },
        },
      },
    });
  });

  it("should handle emoji versions", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockEmojiTest = `
# group: Smileys & Emotion
# subgroup: face-smiling
1F600 ; fully-qualified     # 😀 E6.0 grinning face
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    const result = await runSourceAdapter(metadataHandler, mockContext);
    // @ts-expect-error - types are not matching, will fix later
    expect(result.emojis["smileys-emotion-face-smiling"]["1F600"].emojiVersion).toBe("6.0");
  });

  it("should handle disallowed emoji versions", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const result = await runSourceAdapter(metadataHandler, { ...mockContext, emoji_version: "1.0" });

    expect(result).toEqual({
      emojis: {},
      groups: [],
    });
  });

  it("should handle empty response", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text("")],
    ]);

    const result = await runSourceAdapter(metadataHandler, mockContext);
    expect(result).toEqual({
      emojis: {},
      groups: [],
    });
  });

  it("should handle network errors", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/emoji/${mockContext.emoji_version}/emoji-test.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runSourceAdapter(metadataHandler, mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runSourceAdapter } = await setupAdapterTest({ cache });

    const mockEmojiTest = emojiTest.smileys({
      commentPrefix: "#",
      separator: ";",
      version: "15.0",
    });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => {
        fetchCount++;
        return HttpResponse.text(mockEmojiTest);
      }],
    ]);

    // first request
    await runSourceAdapter(metadataHandler, mockContext);

    // second request with force=true should bypass cache
    await runSourceAdapter(metadataHandler, { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });

  it("should handle invalid line format", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockEmojiTest = emojiTest.invalid({
      commentPrefix: "#",
      separator: ";",
      version: "15.0",
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    await expect(runSourceAdapter(metadataHandler, mockContext))
      .rejects
      .toThrow("invalid line");
  });

  it("should handle subgroup without group", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockEmojiTest = `
# subgroup: face-smiling
1F600 ; fully-qualified     # 😀 grinning face
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    await expect(runSourceAdapter(metadataHandler, mockContext))
      .rejects
      .toThrow("subgroup face-smiling without group");
  });
});
