import type {
  EmojiGroupWithMetadata,
  EmojiSequence,
  EmojiVersion,
} from "@mojis/internal-utils";

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

  /**
   * A function to get the emoji group metadata.
   * @param {BaseAdapterContext} ctx The adapter context.
   * @returns {Promise<EmojiGroupWithMetadata[]>} The emoji group metadata.
   */
  metadata?: (ctx: BaseAdapterContext) => Promise<EmojiGroupWithMetadata[]>;

  /**
   * A function to generate the emoji sequences for the specified version
   * @param {BaseAdapterContext} ctx The adapter context.
   * @returns {Promise<{ zwj: EmojiSequence[]; sequences: EmojiSequence[] }>} The emoji sequences.
   */
  sequences?: (ctx: BaseAdapterContext) => Promise<{ zwj: EmojiSequence[]; sequences: EmojiSequence[] }>;
}

export interface BaseAdapterContext {
  force: boolean;
  versions: EmojiVersion;
}
