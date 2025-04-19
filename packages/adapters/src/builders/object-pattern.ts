import type { CacheOptions } from "@mojis/internal-utils";
import type { AdapterContext, BuiltinParser, PossibleUrls } from "../global-types";
import type { GetParseOptionsFromParser, GetParseOutputFromBuiltInParser, ParserFn, WrapInContextFn } from "./source-transformer-builder/types";
import { type } from "arktype";

export interface ObjectPattern<TOutputSchema extends type.Any> {
  type: string;
  outputSchema: TOutputSchema;
  fallback: TOutputSchema["infer"];
  transformers: Array<ObjectTransformer<any, any, any, TOutputSchema["infer"]>>;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function defineObjectPattern<
  TOutputSchema extends type.Any,
>(opts: ObjectPattern<TOutputSchema>) {
  return opts;
}

type InferParserOutput<TParser extends BuiltinParser | ParserFn<AdapterContext, any>> =
  TParser extends ParserFn<AdapterContext, infer TOut>
    ? TOut
    : TParser extends BuiltinParser
      ? GetParseOutputFromBuiltInParser<TParser>
      : never;

interface ObjectTransformer<
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

function defineObjectTransformer<
  TUrls extends PossibleUrls,
  const TParser extends BuiltinParser | ParserFn<AdapterContext, any>,
  TTransformerOutput,
  TOutputType,
>(opts: ObjectTransformer<
  TUrls,
  TParser,
  TTransformerOutput,
  TOutputType
>): ObjectTransformer<
    TUrls,
    TParser,
    TTransformerOutput,
    TOutputType
  > {
  return opts;
}

const a = defineObjectPattern({
  type: "object",
  outputSchema: type({
    hello: "string",
  }),
  fallback: {
    hello: "world",
  },
  transformers: [
    defineObjectTransformer({
      urls: () => "asda",
      parser: "generic",
      parserOptions: {
        commentPrefix: "//",
      },
      transform: (ctx, data) => {
        return {
          hello: "world",
        };
      },
      output(ctx, data) {
        return {
          hello: data.hello,
        };
      },
    }),
  ],
});
