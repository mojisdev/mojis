import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import process from "node:process";
import * as sourceAdapters from "../../adapters/src/handlers/source";

const root = new URL("../", import.meta.url);

async function run() {
  console.log("cleaning up schemas...");
  await rm(`${root.pathname}/schemas`, { recursive: true, force: true });

  console.log("writing schemas...");

  const pkg = JSON.parse(await readFile(`${root.pathname}/package.json`, "utf-8"));

  const defaultExports = {
    "./package.json": "./package.json",
  };
  const exports: Record<string, string> = {};

  for (const [name, handler] of Object.entries(sourceAdapters)) {
    if (handler == null) {
      console.log(`skipping ${name}...`);
      continue;
    }

    await mkdir(`${root.pathname}/schemas`, { recursive: true });
    for (const [key, value] of Object.entries(handler.persistence.schemas)) {
      await writeFile(
        `${root.pathname}/schemas/${handler.adapterType}-${key}.json`,
        JSON.stringify(value.schema.toJsonSchema(), null, 2),
      );
      exports[`./${handler.adapterType}-${key}.json`] = `./schemas/${handler.adapterType}-${key}.json`;
      console.log(`wrote ${handler.adapterType}-${key}.json`);
    }
  }

  await writeFile(
    `${root.pathname}/package.json`,
    `${JSON.stringify({
      ...pkg,
      exports: {
        ...exports,
        ...defaultExports,
      },
    }, null, 2)}\n`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
