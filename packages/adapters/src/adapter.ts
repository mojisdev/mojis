import type { EmojiGroup, EmojiMetadata, EmojiVersion } from "@mojis/internal-utils";
import semver from "semver";

export interface MojiAdapter {
  /**
   * The name of the adapter.
   */
  name: string;

  /**
   * A description of the adapter.
   */
  description: string;

  /**
   * A valid semver range for the emoji version this adapter supports.
   */
  range: string;

  /**
   * The name of the adapter to extend from.
   */
  extend?: string;

  // /**
  //  * A function to generate the emoji sequences for the specified version
  //  */
  // sequences?: SequenceFn;

  metadata?: MetadataFn;
}

export interface BaseAdapterContext {
  force: boolean;
  emojiVersion: string;
  unicodeVersion: string;
}

export type MetadataFn = (ctx: BaseAdapterContext) => Promise<{
  groups: EmojiGroup[];
  emojiMetadata: Record<string, Record<string, EmojiMetadata>>;
}>;

export const ADAPTERS = new Map<string, MojiAdapter>();

export function defineMojiAdapter(adapter: MojiAdapter): MojiAdapter {
  // validate the adapter has name, description, range.
  if (!adapter.name) {
    throw new Error(`adapter.name is required`);
  }

  if (!adapter.description) {
    throw new Error(`adapter.description is required`);
  }

  if (!adapter.range) {
    throw new Error(`adapter.range is required`);
  }

  // verify the adapter.range is a valid semver range.
  if (semver.validRange(adapter.range) === null) {
    throw new Error(`adapter.range is not a valid semver range`);
  }

  if (adapter.extend == null) {
    // TODO: ensure the adapter has the required functions, when not extending.
  }

  ADAPTERS.set(adapter.name, adapter);

  return adapter;
}
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
