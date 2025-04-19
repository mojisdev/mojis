import { bench } from "@arktype/attest";
import { handler } from "../src/handlers/source/metadata";

bench("bench type", () => {
  // eslint-disable-next-line ts/no-unused-expressions
  handler;
}).types([20936, "instantiations"]);
