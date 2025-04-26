import { mkdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import process from "node:process";

const root = new URL("../../../test/fixtures/parsers/", import.meta.url);

interface Entry {
  type: "directory" | "file";
  name: string;
  path: string;
}

async function run() {
  const rootResponse = await fetch("https://unicode-proxy.ucdjs.dev/proxy/emoji/");

  if (!rootResponse.ok) {
    throw new Error("failed to fetch root entry");
  }

  const rootEntries: Entry[] = await rootResponse.json();
  await mkdir(root, { recursive: true });

  async function processDirectory(entry: Entry, basePath: string) {
    const dirResponse = await fetch(`https://unicode-proxy.ucdjs.dev/proxy${entry.path}`);
    const dirEntries: Entry[] = await dirResponse.json();

    const fileEntries = dirEntries.filter(
      (e) =>
        e.type === "file"
        && e.name !== "ReadMe.txt"
        && !e.path.includes("latest")
        && !e.path.includes("draft"),
    );

    await Promise.all(
      fileEntries.map(async (fileEntry) => {
        const fullPath = basePath + fileEntry.path;
        const [_, version, ...rest] = fullPath.replace(/^\//, "").split("/");
        const fileExt = extname(fileEntry.name);
        const type = rest.join("").replace(fileExt, "");

        await mkdir(new URL(type, root), { recursive: true });

        const content = await fetch(`https://unicode-proxy.ucdjs.dev/proxy${fullPath}`).then((res) => res.text());
        await writeFile(
          new URL(`${type}/v${version.toString()}${fileExt}`, root),
          content,
        );
      }),
    );

    const dirEntriesToProcess = dirEntries.filter((e) => e.type === "directory");
    await Promise.all(
      dirEntriesToProcess.map((dir) => processDirectory(dir, basePath + entry.path)),
    );
  }

  const directories = rootEntries.filter((e) => e.type === "directory");
  await Promise.all(directories.map((dir) => processDirectory(dir, "")));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
