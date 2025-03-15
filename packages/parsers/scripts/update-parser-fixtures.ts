import type { Entry } from "apache-autoindex-parse";
import { mkdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import process from "node:process";
import { traverse } from "apache-autoindex-parse/traverse";

const root = new URL("../../../test/fixtures/parsers/", import.meta.url);

async function run() {
  const rootEntry = await traverse("https://unicode-proxy.mojis.dev/proxy/emoji/", {
    format: "F2",
  });

  if (!rootEntry) {
    throw new Error("failed to fetch root entry");
  }

  await mkdir(root, { recursive: true });

  async function processEntry(entry: Entry) {
    if (entry.type === "directory") {
      for (const child of entry.children) {
        await processEntry(child);
      }

      return;
    }

    if (
      entry.name === "ReadMe.txt"
      || entry.path.includes("latest")
      || entry.path.includes("draft")
    ) {
      return;
    }

    const [version, ...rest] = entry.path.replace(/^\/Public\/emoji\//, "").split("/");
    const fileExt = extname(entry.name);

    const type = rest.join("").replace(fileExt, "");
    await mkdir(new URL(type, root), { recursive: true });

    const content = await fetch(`https://unicode.org${entry.path}`).then((res) => res.text());
    await writeFile(
      new URL(`${type}/v${version.toString()}${fileExt}`, root),
      content,
    );
  }

  for (const entry of rootEntry.children) {
    await processEntry(entry);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
