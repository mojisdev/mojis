import { describe, expect, it } from "vitest";
import { handler } from "../../src/handlers/metadata";

describe("metadata adapter handler", () => {
  it("should handle disallowed emoji versions", async () => {
    const result = await handler.handlers[0][1].transform(
      { emoji_version: "1.0", unicode_version: "1.0", force: false },
      [],
    );

    expect(result).toEqual({
      groups: [],
      emojis: {},
    });
  });
});
