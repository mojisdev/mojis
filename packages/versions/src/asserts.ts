import { isEmojiVersionAllowed } from "./validation";

export function assertValidVersion(version: string): void {
  if (!isEmojiVersionAllowed(version)) {
    throw new Error(`Invalid emoji version: ${version}`);
  }
}
