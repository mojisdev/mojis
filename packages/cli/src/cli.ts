import process from "node:process";
import { cli } from "./cli-utils";

cli(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
