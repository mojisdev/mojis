import type {
  AdapterContext,
  BuiltinParser,
  v2_AdapterHandler,
  v2_AdapterHandlerType,
  v2_GetParseOutputFromBuiltInParser,
  v2_OutputFn,
} from "./types";

export function defineAdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
>(
  handler: Omit<
    v2_AdapterHandler<TType, TExtraContext, TContext, TTransformOutput>,
    "output"
  > & {
    output: v2_OutputFn<TContext, TExtraContext, TTransformOutput, any>;
  }
): v2_AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TTransformOutput,
  ReturnType<typeof handler.output>
>;
export function defineAdapterHandler<
  TType extends v2_AdapterHandlerType,
  TExtraContext extends Record<string, unknown>,
  TContext extends AdapterContext,
  TTransformOutput,
  TAggregateOutput = TTransformOutput,
  TOutput = TTransformOutput | TAggregateOutput,
  TBuiltinParser extends BuiltinParser = BuiltinParser,
  TParseOutput = v2_GetParseOutputFromBuiltInParser<BuiltinParser>,
>(handler: v2_AdapterHandler<
  TType,
  TExtraContext,
  TContext,
  TTransformOutput,
  TAggregateOutput,
  TOutput,
  TBuiltinParser,
  TParseOutput
>): v2_AdapterHandler<
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
