// TODO: fix the export to remove barrel file

export * from "./cache";
export * from "./constants";
export * from "./hexcode";
export * from "./shortcodes";
export type * from "./types";

export class MojisNotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MojisNotImplemented";
  }
}
