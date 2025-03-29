import { mkdir, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import { EMOJI_GROUPS_SCHEMA } from "@mojis/schemas/emojis";
import { zodToJsonSchema } from "zod-to-json-schema";

const root = new URL("../", import.meta.url);

async function run() {
  console.log("cleaning up schemas...");
  await rm(`${root.pathname}/schemas`, { recursive: true, force: true });

  console.log("writing schemas...");
  const groups = zodToJsonSchema(EMOJI_GROUPS_SCHEMA);

  await mkdir(`${root.pathname}/schemas`, { recursive: true });
  await writeFile(`${root.pathname}/schemas/groups.json`, JSON.stringify(groups, null, 2));
  console.log("done!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
