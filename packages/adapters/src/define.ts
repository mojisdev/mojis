import type {
  AdapterContext,
  AdapterHandler,
  AdapterHandlerType,
  BuiltinParser,
  GetParseOutputFromBuiltInParser,
  InferParseOutput,
  ParserFn,
} from "./types";

export function defineAdapterHandler<
  TAdapterHandlerType extends AdapterHandlerType,
  TContext extends AdapterContext,
  TParser extends (string | ParserFn<TContext, unknown>),
  TTransformOutput,
  TParseOutput = InferParseOutput<TContext, TParser>,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
>(handler: AdapterHandler<
  TAdapterHandlerType,
  TContext,
  TParser,
  TTransformOutput,
  TParseOutput,
  TAggregateOutput,
  TOutput
>): AdapterHandler<
    TAdapterHandlerType,
    TContext,
    TParser,
    TTransformOutput,
    TParseOutput,
    TAggregateOutput,
    TOutput
  > {
  return handler;
}
