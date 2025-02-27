import type {
  EmojiGroup,
  EmojiMetadata,
  EmojiSequence,
  EmojiShortcode,
  EmojiVariation,
  EmojiVersion,
  ShortcodeProvider,
} from "@mojis/internal-utils";

// TODO: find a better name
interface EmojiDataStructure {
  groups: EmojiGroup[];
  emojis: Record<string, Record<string, EmojiMetadata>>;
}

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
   * @returns {Promise<EmojiDataStructure>} The emoji group metadata.
   */
  metadata?: (ctx: BaseAdapterContext) => Promise<EmojiDataStructure>;

  /**
   * A function to generate the emoji sequences for the specified version
   * @param {BaseAdapterContext} ctx The adapter context.
   * @returns {Promise<{ zwj: EmojiSequence[]; sequences: EmojiSequence[] }>} The emoji sequences.
   */
  sequences?: (ctx: BaseAdapterContext) => Promise<{ zwj: EmojiSequence[]; sequences: EmojiSequence[] }>;

  /**
   * A function to generate shortcodes for emojis based on provided shortcode providers.
   * @param {BaseAdapterContext & { providers: ShortcodeProvider[] }} ctx The adapter context with shortcode providers.
   * @returns {Promise<Partial<Record<ShortcodeProvider, EmojiShortcode[]>>>} The generated shortcodes mapped by provider.
   */
  shortcodes?: (ctx: BaseAdapterContext & {
    providers: ShortcodeProvider[];
  }) => Promise<Partial<Record<ShortcodeProvider, EmojiShortcode[]>>>;

  /**
   * A function to get the emoji variations.
   * @param {BaseAdapterContext} ctx The adapter context
   * @returns {Promise<EmojiVariation[]>} The emoji variation.
   */
  variations?: (ctx: BaseAdapterContext) => Promise<EmojiVariation[]>;

  /**
   * A function to get the emojis.
   * @param {BaseAdapterContext} ctx The adapter context.
   * @returns {Promise<Record<string, string>>} The emojis.
   */
  emojis?: (ctx: BaseAdapterContext) => Promise<Record<string, string>>;
}

export interface BaseAdapterContext {
  force: boolean;
  versions: EmojiVersion;
}
