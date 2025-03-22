import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { EMOJI_GROUPS_SCHEMA } from "@mojis/internal-utils/schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

const root = new URL("../", import.meta.url);

async function run() {
  const groups = zodToJsonSchema(EMOJI_GROUPS_SCHEMA);

  await mkdir(`${root.pathname}/schemas`, { recursive: true });
  await writeFile(`${root.pathname}/schemas/groups.json`, JSON.stringify(groups, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
