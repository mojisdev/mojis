// TODO: fix the export to remove barrel file

export * from "./cache";
export * from "./constants";
export * from "./hexcode";
export * from "./predicates";
export * from "./shortcodes";
export type * from "./types";
export * from "./versions";

export class MojisNotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MojisNotImplemented";
  }
}
