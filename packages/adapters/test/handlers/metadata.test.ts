import { HttpResponse, mockFetch } from "#msw-utils";
import { createCache } from "@mojis/internal-utils";
import { afterEach, describe, expect, it } from "vitest";
import { handler } from "../../src/handlers/metadata";
import { cleanupAdapterTest, setupAdapterTest } from "../test-utils";

describe("metadata adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: true,
  };

  afterEach(() => {
    cleanupAdapterTest();
  });

  it("should handle basic emoji metadata", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockEmojiTest = `
# group: Smileys & Emotion
# subgroup: face-smiling
1F600 ; fully-qualified # 😀 E1.0 grinning face
1F601 ; fully-qualified # 😁 E0.6 beaming face with smiling eyes
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    const result = await runAdapterHandler("metadata", mockContext);
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
        },
      },
    });
  });

  it("should handle emoji versions", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockEmojiTest = `
# group: Smileys & Emotion
# subgroup: face-smiling
1F600 ; fully-qualified     # 😀 E6.0 grinning face
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result.emojis["smileys-emotion-face-smiling"]["1F600"].emojiVersion).toBe("6.0");
  });

  it("should handle disallowed emoji versions", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: handler.handlers[0][0],
      handler: handler.handlers[0][1],
      fallback: handler.fallback,
      outputSchema: handler.outputSchema,
    });

    const result = await runAdapterHandler("metadata", { ...mockContext, emoji_version: "1.0" });

    expect(result).toEqual({
      emojis: {},
      groups: [],
    });
  });

  it("should handle empty response", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text("")],
    ]);

    const result = await runAdapterHandler("metadata", mockContext);
    expect(result).toEqual({
      emojis: {},
      groups: [],
    });
  });

  it("should handle network errors", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    mockFetch(`GET https://unicode-proxy.mojis.dev/proxy/emoji/${mockContext.emoji_version}/emoji-test.txt`, () => {
      return HttpResponse.error();
    });

    await expect(() => runAdapterHandler("metadata", mockContext))
      .rejects
      .toThrow("Failed to fetch");
  });

  it("should handle force mode", async () => {
    const cache = createCache<string>({ store: "memory" });
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest({ cache });
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    let fetchCount = 0;
    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => {
        fetchCount++;
        return HttpResponse.text("# group: Smileys & Emotion\n# subgroup: face-smiling\n1F600 ; fully-qualified     # 😀 grinning face");
      }],
    ]);

    // first request
    await runAdapterHandler("metadata", mockContext);

    // second request with force=true should bypass cache
    await runAdapterHandler("metadata", { ...mockContext, force: true });

    expect(fetchCount).toBe(2);
  });

  it("should handle invalid line format", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockEmojiTest = `
# group: Smileys & Emotion
# subgroup: face-smiling
invalid-line
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    await expect(runAdapterHandler("metadata", mockContext))
      .rejects
      .toThrow("invalid line");
  });

  it("should handle subgroup without group", async () => {
    const { runAdapterHandler, addHandlerToMock } = await setupAdapterTest();
    addHandlerToMock("metadata", {
      predicate: () => true,
      handler: handler.handlers[0][1],
    });

    const mockEmojiTest = `
# subgroup: face-smiling
1F600 ; fully-qualified     # 😀 grinning face
`;

    mockFetch([
      ["GET https://unicode-proxy.mojis.dev/proxy/emoji/15.0/emoji-test.txt", () => HttpResponse.text(mockEmojiTest)],
    ]);

    await expect(runAdapterHandler("metadata", mockContext))
      .rejects
      .toThrow("subgroup face-smiling without group");
  });
});
