import type { CacheOptions } from "@mojis/internal-utils";
import type { type } from "arktype";
import type { AdapterContext, BuiltinParser, PossibleUrls } from "../../global-types";
import type { GetParseOptionsFromParser, GetParseOutputFromBuiltInParser, ParserFn, WrapInContextFn } from "./types";

type InferParserOutput<TParser extends BuiltinParser | ParserFn<AdapterContext, any>> =
  TParser extends ParserFn<AdapterContext, infer TOut>
    ? TOut
    : TParser extends BuiltinParser
      ? GetParseOutputFromBuiltInParser<TParser>
      : never;

export interface SourceTransformer<
  TUrls extends PossibleUrls,
  TParser extends BuiltinParser | ParserFn<AdapterContext, any>,
  TTransformerOutput,
  TOutputType,
> {
  urls: (ctx: AdapterContext) => TUrls;
  parser: TParser;
  parserOptions: TParser extends BuiltinParser
    ?
    | GetParseOptionsFromParser<TParser>
    | WrapInContextFn<
      AdapterContext,
      { key: string },
      GetParseOptionsFromParser<TParser>
    >
    : never;
  transform: (
    ctx: AdapterContext,
    data: InferParserOutput<TParser>,
  ) => TTransformerOutput;
  aggregate?: (
    ctx: AdapterContext,
    data: TTransformerOutput[]
  ) => TTransformerOutput;
  cacheOptions?: CacheOptions;
  fetchOptions?: RequestInit;
  output: (
    ctx: AdapterContext,
    data: TTransformerOutput,
  ) => TOutputType;
}

export function defineSourceTransformer<
  TUrls extends PossibleUrls,
  const TParser extends BuiltinParser | ParserFn<AdapterContext, any>,
  TTransformerOutput,
  TOutputType,
>(handler: SourceTransformer<
  TUrls,
  TParser,
  TTransformerOutput,
  TOutputType
>): SourceTransformer<
    TUrls,
    TParser,
    TTransformerOutput,
    TOutputType
  > {
  return handler;
}
