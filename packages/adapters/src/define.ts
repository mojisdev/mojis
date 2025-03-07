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
  TType extends AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput,
>(
  handler: Omit<AdapterHandler<
    TType,
    TExtraContext,
    TContext,
    TTransformOutput,
    TAggregateOutput
  >, "output" | "aggregate"> & {
    aggregate: AggregateFn<TContext, TExtraContext, TTransformOutput, TAggregateOutput>;
    output: OutputFn<TContext, TExtraContext, TAggregateOutput, any>;
  }
): AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  ReturnType<typeof handler.output>
>;
export function defineAdapterHandler<
  TType extends AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
>(
  handler: Omit<
    AdapterHandler<TType, TExtraContext, TContext, TTransformOutput>,
    "output"
  > & {
    output: OutputFn<TContext, TExtraContext, TTransformOutput, any>;
  }
): AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TTransformOutput,
  ReturnType<typeof handler.output>
>;
export function defineAdapterHandler<
  TType extends AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
  TBuiltinParser extends BuiltinParser = BuiltinParser,
  TParseOutput = GetParseOutputFromBuiltInParser<TBuiltinParser>,
>(handler: AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  TOutput,
  TBuiltinParser,
  TParseOutput
>): AdapterHandler<
    TType,
    TExtraContext,
    TContext,
    TTransformOutput,
    TAggregateOutput,
    TOutput,
    TBuiltinParser,
    TParseOutput
  > {
  return handler;
}
