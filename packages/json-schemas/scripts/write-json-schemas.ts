import { mkdir, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import { createCache } from "@mojis/internal-utils";
import { EMOJI_GROUPS_SCHEMA, GROUPED_BY_HEXCODE_EMOJI_METADATA_SCHEMA } from "@mojis/schemas/emojis";
import * as sourceAdapters from "../../adapters/src/handlers/source";
import { runSourceAdapter } from "../../adapters/src/runners/source-runner";

const root = new URL("../", import.meta.url);

async function run() {
  console.log("cleaning up schemas...");
  await rm(`${root.pathname}/schemas`, { recursive: true, force: true });

  console.log("writing schemas...");

  for (const [name, handler] of Object.entries(sourceAdapters)) {
    if (name !== "metadataHandler") continue;

    if (handler == null) {
      console.log(`skipping ${name}...`);
      continue;
    }

    if (handler.persistenceOutputSchema == null) {
      console.log(`skipping ${name}...`);
      continue;
    }

    const generating = await runSourceAdapter(handler, {
      force: true,
      emoji_version: "15.0",
      unicode_version: "15.0",
    }, {
      write: false,
      cache: createCache({ store: "memory" }),
    });

    console.log(generating);

    const schema = handler.persistenceOutputSchema.toJsonSchema();

    const operations = handler?.persistence(generating, {
      basePath: `./schema/${name}`,
      version: "15.0",
    });

    console.log(schema, name);
  }

  const groups = EMOJI_GROUPS_SCHEMA.toJsonSchema();
  const transformedEmojis = GROUPED_BY_HEXCODE_EMOJI_METADATA_SCHEMA.toJsonSchema();

  await mkdir(`${root.pathname}/schemas`, { recursive: true });
  await writeFile(`${root.pathname}/schemas/groups.json`, JSON.stringify(groups, null, 2));
  await writeFile(`${root.pathname}/schemas/emojis.json`, JSON.stringify(transformedEmojis, null, 2));
  console.log("done!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
