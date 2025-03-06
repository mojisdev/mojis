import type {
  EmojiGroup,
  EmojiMetadata,
} from "@mojis/internal-utils";
import type { AdapterHandler } from "./types";
import { modern_metadata_handler } from "./handlers/modern";

export const metadata_handlers = [
  modern_metadata_handler,
] satisfies AdapterHandler<"metadata", any, any, any, any, {
  groups: EmojiGroup[];
  emojis: Record<string, Record<string, EmojiMetadata>>;
}>[];
