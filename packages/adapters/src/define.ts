import type {
  AdapterContext,
  AdapterHandler,
  AdapterHandlerType,
  AggregateFn,
  BuiltinParser,
  GetParseOutputFromBuiltInParser,
  OutputFn,
} from "./types";

export function defineAdapterHandler<
  TAdapterHandlerType extends AdapterHandlerType,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
  TBuiltinParser extends BuiltinParser = BuiltinParser,
  TParseOutput = GetParseOutputFromBuiltInParser<TBuiltinParser>,
>(handler: AdapterHandler<
  TAdapterHandlerType,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  TOutput,
  TBuiltinParser,
  TParseOutput
>): AdapterHandler<
    TAdapterHandlerType,
    TContext,
    TTransformOutput,
    TAggregateOutput,
    TOutput,
    TBuiltinParser,
    TParseOutput
  > {
  return handler;
}
