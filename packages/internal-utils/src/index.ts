export * from "./cache";
export * from "./hexcode";
export type * from "./types";
export * from "./versions";

export class MojisNotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MojisNotImplemented";
  }
}
