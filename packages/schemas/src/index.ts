import { type } from "arktype";

export const SHORTCODE_PROVIDER_SCHEMA = type("'github' | 'slack'");

export type ShortcodeProvider = typeof SHORTCODE_PROVIDER_SCHEMA.infer;

export const SHORTCODE_PROVIDERS_SCHEMA = SHORTCODE_PROVIDER_SCHEMA.array();

export const GENERATOR_SCHEMA = type("'metadata' | 'sequences' | 'emojis' | 'variations' | 'shortcodes' | 'unicode-names'");

export type Generator = typeof GENERATOR_SCHEMA.infer;
