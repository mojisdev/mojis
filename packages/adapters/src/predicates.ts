import type { PredicateFn } from "./builders/source-builder/types";
import { gt } from "semver";

export const alwaysTrue: PredicateFn = () => true;
export const alwaysFalse: PredicateFn = () => false;

export function onlyGreaterThan(version: string): PredicateFn {
  return (emoji_version) => gt(emoji_version, version);
}

export function onlyLessThan(version: string): PredicateFn {
  return (emoji_version) => gt(version, emoji_version);
}
