import type {
  EmojiGroup,
  EmojiMetadata,
} from "@mojis/internal-utils";
import type { v2_AdapterHandler, v2_AdapterHandlerType } from "./types";
import { modern_metadata_handler } from "./handlers/modern";

export const v2_metadata_handlers = [
  modern_metadata_handler,
] satisfies v2_AdapterHandler<"metadata", any, any, any, any>[];
