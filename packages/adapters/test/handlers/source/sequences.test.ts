import { HttpResponse, mockFetch } from "#msw-utils";
import { sequences } from "@mojis/loomicode";
import { describe, expect, it } from "vitest";
import { sequencesHandler } from "../../../src/handlers/source";
import { setupAdapterTest } from "../../__utils";

describe("sequences adapter handler", () => {
  const mockContext = {
    emoji_version: "15.0",
    unicode_version: "15.0",
    force: false,
  };

  it("should handle sequences only", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockedSequences = sequences({
      version: "15.0",
      commentPrefix: "#",
      input: [
        {
          codePoints: ["1F694"],
          type: "Basic_Emoji",
          description: "oncoming police car",
          comment: "E0.7   [1] (🚔)",
        },
        {
          codePoints: ["1F695"],
          type: "Basic_Emoji",
          description: "taxi",
          comment: "E0.6   [1] (🚕)",
        },
        {
          codePoints: ["1F696"],
          type: "Basic_Emoji",
          description: "oncoming taxi",
          comment: "E1.0   [1] (🚖)",
        },
        {
          codePoints: ["1F697"],
          type: "Basic_Emoji",
          description: "automobile",
          comment: "E1.0   [1] (🚖)",
        },
      ],
      separator: ";",
    });

    mockFetch([
      [
        "GET https://unicode-proxy.ucdjs.dev/emoji/15.0/emoji-sequences.txt",
        () => HttpResponse.text(mockedSequences),
      ],
      [
        "GET https://unicode-proxy.ucdjs.dev/emoji/15.0/emoji-zwj-sequences.txt",
        () => HttpResponse.text(),
      ],
    ]);

    const result = await runSourceAdapter(sequencesHandler, mockContext);

    expect(result.zwj).toBeDefined();
    expect(result.zwj).toHaveLength(0);
    expect(result.sequences).toBeDefined();
    expect(result.sequences).toStrictEqual([
      {
        hex: "1F694",
        property: "Emoji",
        description: "oncoming police car",
        gender: null,
      },
      {
        hex: "1F695",
        property: "Emoji",
        description: "taxi",
        gender: null,
      },
      {
        hex: "1F696",
        property: "Emoji",
        description: "oncoming taxi",
        gender: null,
      },
      {
        hex: "1F697",
        property: "Emoji",
        description: "automobile",
        gender: null,
      },
    ]);
  });

  // TODO: fix this test
  it("should handle zwj sequences only", async () => {
    const { runSourceAdapter } = await setupAdapterTest();

    const mockedSequences = sequences({
      version: "15.0",
      commentPrefix: "#",
      input: [
        {
          codePoints: ["1F694"],
          type: "Basic_Emoji",
          description: "oncoming police car",
          comment: "E0.7   [1] (🚔)",
        },
        {
          codePoints: ["1F695"],
          type: "Basic_Emoji",
          description: "taxi",
          comment: "E0.6   [1] (🚕)",
        },
        {
          codePoints: ["1F696"],
          type: "Basic_Emoji",
          description: "oncoming taxi",
          comment: "E1.0   [1] (🚖)",
        },
        {
          codePoints: ["1F697"],
          type: "Basic_Emoji",
          description: "automobile",
          comment: "E1.0   [1] (🚖)",
        },
      ],
      separator: ";",
    });

    mockFetch([
      [
        "GET https://unicode-proxy.ucdjs.dev/emoji/15.0/emoji-sequences.txt",
        () => HttpResponse.text(),
      ],
      [
        "GET https://unicode-proxy.ucdjs.dev/emoji/15.0/emoji-zwj-sequences.txt",
        () => HttpResponse.text(mockedSequences),
      ],
    ]);

    const result = await runSourceAdapter(sequencesHandler, mockContext);

    expect(result.sequences).toBeDefined();
    expect(result.sequences).toHaveLength(0);
    expect(result.zwj).toBeDefined();
    expect(result.zwj).toStrictEqual([
      {
        hex: "1F694",
        property: "Emoji",
        description: "oncoming police car",
        gender: null,
      },
      {
        hex: "1F695",
        property: "Emoji",
        description: "taxi",
        gender: null,
      },
      {
        hex: "1F696",
        property: "Emoji",
        description: "oncoming taxi",
        gender: null,
      },
      {
        hex: "1F697",
        property: "Emoji",
        description: "automobile",
        gender: null,
      },
    ]);
  });
});
