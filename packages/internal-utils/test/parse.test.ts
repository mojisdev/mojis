import { describe, expect, it } from "vitest";
import { parse } from "../src/parse";

describe("parse function", () => {
  it("should handle empty content", () => {
    const result = parse("");
    expect(result).toEqual({ totalLines: 0, lines: [] });
  });

  it("should parse simple lines with default options", () => {
    const content = "field1;field2;field3\nfield4;field5;field6";
    const result = parse(content);
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", property: "", fields: ["field1", "field2", "field3"] },
        { comment: "", property: "", fields: ["field4", "field5", "field6"] },
      ],
    });
  });

  it("should handle custom separator", () => {
    const content = "field1,field2,field3\nfield4,field5,field6";
    const result = parse(content, { separator: "," });
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", property: "", fields: ["field1", "field2", "field3"] },
        { comment: "", property: "", fields: ["field4", "field5", "field6"] },
      ],
    });
  });

  it("should handle comments", () => {
    const content = "field1;field2;field3 # comment1\nfield4;field5;field6 # comment2";
    const result = parse(content);
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "comment1", property: "", fields: ["field1", "field2", "field3"] },
        { comment: "comment2", property: "", fields: ["field4", "field5", "field6"] },
      ],
    });
  });

  it("should handle custom comment prefix", () => {
    const content = "field1;field2;field3 // comment1\nfield4;field5;field6 // comment2";
    const result = parse(content, { commentPrefix: "//" });
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "comment1", property: "", fields: ["field1", "field2", "field3"] },
        { comment: "comment2", property: "", fields: ["field4", "field5", "field6"] },
      ],
    });
  });

  it("should handle property mapping", () => {
    const content = "# SECTION1\nfield1;field2\n# SECTION2\nfield3;field4";
    const result = parse(content, { propertyMap: { "# SECTION1": "section1", "# SECTION2": "section2" } });
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", fields: ["field1", "field2"], property: "section1" },
        { comment: "", fields: ["field3", "field4"], property: "section2" },
      ],
      properties: { "# SECTION1": "section1", "# SECTION2": "section2" },
    });
  });

  it("should handle default property", () => {
    const content = "field1;field2\n# SECTION1\nfield3;field4";
    const result = parse(content, { propertyMap: { "# SECTION1": "section1" }, defaultProperty: "default" });
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", fields: ["field1", "field2"], property: "default" },
        { comment: "", fields: ["field3", "field4"], property: "section1" },
      ],
      properties: { "# SECTION1": "section1" },
    });
  });

  it("should handle totals in comments", () => {
    const content = "# SECTION1 Total: 10\nfield1;field2\n# SECTION2 Total: 20\nfield3;field4";
    const result = parse(content, { propertyMap: { "# SECTION1": "section1", "# SECTION2": "section2" } });
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", fields: ["field1", "field2"], property: "section1" },
        { comment: "", fields: ["field3", "field4"], property: "section2" },
      ],
      properties: { "# SECTION1": "section1", "# SECTION2": "section2" },
      totals: { section1: 10, section2: 20 },
    });
  });

  it("should skip empty lines", () => {
    const content = "field1;field2\n\nfield3;field4";
    const result = parse(content);
    expect(result).toEqual({
      totalLines: 2,
      lines: [
        { comment: "", property: "", fields: ["field1", "field2"] },
        { comment: "", property: "", fields: ["field3", "field4"] },
      ],
    });
  });

  it("should handle a line with only a comment", () => {
    const content = "# This is a comment only line";
    const result = parse(content, {});
    expect(result).toEqual({ totalLines: 0, lines: [] });
  });

  it("should handle a line with a comment at the very beginning of the string", () => {
    const content = "#comment\nfield1;field2";
    const result = parse(content);
    expect(result).toEqual({
      totalLines: 1,
      lines: [
        { comment: "", property: "", fields: ["field1", "field2"] },
      ],
    });
  });
});
