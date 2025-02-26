import type { EmojiVersion } from "@mojis/internal-utils";
import type { MojiAdapter } from "./types";
import semver from "semver";

import { baseAdapter } from "./adapters/_base/adapter";
import { modernAdapter } from "./adapters/modern/adapter";
import { preAlignmentAdapter } from "./adapters/pre-alignment/adapter";

const ADAPTERS = new Map<string, MojiAdapter>([
  ["base", baseAdapter],
  ["modern", modernAdapter],
  ["pre-alignment", preAlignmentAdapter],
]);

export function resolveAdapter(emojiVersion: EmojiVersion): MojiAdapter | null {
  const version = semver.coerce(emojiVersion.emoji_version);

  if (version == null) {
    throw new Error(`invalid emoji version ${emojiVersion.emoji_version}`);
  }

  const matchingAdapters = Array.from(ADAPTERS.values()).filter((adapter) =>
    semver.satisfies(version, adapter.range),
  );

  if (matchingAdapters.length === 0) {
    throw new Error(`no adapter found for version ${version}`);
  }

  if (matchingAdapters.length > 1) {
    return matchingAdapters.reduce((selected, current) => {
      const selectedLower = semver.minVersion(selected.range);
      const currentLower = semver.minVersion(current.range);

      if (!selectedLower || !currentLower) {
        if (selected.extend == null) {
          return selected;
        }

        const parent = ADAPTERS.get(selected.extend);

        if (parent == null) {
          throw new Error(`adapter ${selected.name} extends ${selected.extend}, but ${selected.extend} is not registered`);
        }

        return {
          ...parent,
          ...selected,
        };
      }

      const adapter = semver.gt(currentLower, selectedLower) ? current : selected;

      if (adapter.extend == null) {
        return adapter;
      }

      const parent = ADAPTERS.get(adapter.extend);

      if (parent == null) {
        throw new Error(`adapter ${adapter.name} extends ${adapter.extend}, but ${adapter.extend} is not registered`);
      }

      return {
        ...parent,
        ...adapter,
      };
    });
  }

  if (matchingAdapters.length === 1 && matchingAdapters[0] != null) {
    const adapter = matchingAdapters[0];

    if (adapter.extend == null) {
      return adapter;
    }

    const parent = ADAPTERS.get(adapter.extend);

    if (parent == null) {
      throw new Error(`adapter ${adapter.name} extends ${adapter.extend}, but ${adapter.extend} is not registered`);
    }

    return {
      ...parent,
      ...adapter,
    };
  }

  return null;
}
