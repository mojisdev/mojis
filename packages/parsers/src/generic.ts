export interface ParsedLine {
  comment: string;
  fields: string[];
  property?: string;
}

export interface GenericParseResult {
  totalLines: number;
  lines: ParsedLine[];
  properties?: Record<string, string>;
  totals?: Record<string, number>;
}

export interface GenericParseOptions {
  commentPrefix?: string;
  separator?: string;
  propertyMap?: Record<string, string>;
  defaultProperty?: string;
}

/**
 * Parses a string content into a structured format based on provided options.
 *
 * @param {string} content - The string content to parse
 * @param {GenericParseOptions} options - Configuration options for parsing
 *
 * @returns  {GenericParseResult} A ParseResult object containing:
 *   - totalLines: The number of non-empty, non-comment lines parsed
 *   - lines: Array of ParsedLine objects with fields, comments, and property values
 *   - properties: (Optional) Record of property mappings that were found in the content
 *   - totals: (Optional) Record of totals extracted from comment lines containing "Total: X"
 *
 * @example
 * ```
 * const result = parse("field1;field2 # comment", {
 *   commentPrefix: "#",
 *   separator: ";"
 * });
 * ```
 */
export function genericParse(
  content: string,
  options: GenericParseOptions = {},
): GenericParseResult {
  const {
    commentPrefix = "#",
    separator = ";",
    propertyMap = {},
    defaultProperty = "",
  } = options;

  const lines: ParsedLine[] = [];
  let totalLines = 0;
  let currentProperty = defaultProperty;
  const totals: Record<string, number> = {};
  const properties: Record<string, string> = {};

  if (!content || content.trim() === "") {
    return {
      totalLines: 0,
      lines: [],
    };
  }

  const contentLines = content.split("\n");

  for (let line of contentLines) {
    // skip empty lines
    if (!line.trim()) {
      continue;
    }

    // handle comment lines
    if (line.startsWith(commentPrefix)) {
      // check for property identification in comments
      for (const [key, value] of Object.entries(propertyMap)) {
        if (line.startsWith(key)) {
          currentProperty = value;
          properties[key] = value;
          break;
        }
      }

      // look for totals in comments if relevant
      if (line.includes("Total") && line.includes(":")) {
        const parts = line.split(":");
        if (parts.length > 1 && parts[1] != null) {
          const total = Number.parseInt(parts[1].trim(), 10);
          if (!Number.isNaN(total)) {
            totals[currentProperty] = total;
          }
        }
      }

      continue;
    }

    // extract the trailing comment if any
    const commentIndex = line.indexOf(commentPrefix);
    let comment = "";

    if (commentIndex > 0) {
      comment = line.slice(commentIndex + commentPrefix.length).trim();
      line = line.slice(0, commentIndex).trim();
    }

    // split into fields based on the separator
    const fields = line
      .split(separator)
      .map((field) => field.trim());

    // add the parsed line
    lines.push({
      comment,
      fields,
      property: currentProperty,
    });

    totalLines++;
  }

  // only include optional properties and totals if they have content
  const result: GenericParseResult = {
    totalLines,
    lines,
  };

  if (Object.keys(properties).length > 0) {
    result.properties = properties;
  }

  if (Object.keys(totals).length > 0) {
    result.totals = totals;
  }

  return result;
}
