import type { z } from "zod";
import type {
  AdapterHandlerType,
  JoinTuples,
} from "../global-types";
import type { AnyHandleVersionParams, AnyVersionHandler, HandleVersionBuilder } from "../version-builder/types";

export type InferHandlerOutput<TAdapterHandler extends AnyAdapterHandler> =
  TAdapterHandler extends { handlers: Array<[any, infer THandler]> }
    ? THandler extends AnyVersionHandler
      ? THandler["output"]
      : never
    : never;

export interface AdapterHandlerBuilder<
  TParams extends AnyAdapterHandlerParams,
> {
  onVersion: <
    TPredicate extends PredicateFn,
    TBuilderParams extends Omit<AnyHandleVersionParams, "_outputSchema"> & {
      _outputSchema: TParams["_outputSchema"] extends z.ZodType ? TParams["_outputSchema"]["_input"] : any;
    },
    TBuilder extends HandleVersionBuilder<TBuilderParams>,
    THandler extends AnyVersionHandler,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => AdapterHandlerBuilder<{
    _adapterType: TParams["_adapterType"];
    _outputSchema: TParams["_outputSchema"];
    _handlers: JoinTuples<TParams["_handlers"], [[TPredicate, THandler]]>;
    _fallback: TParams["_fallback"];
  }>;

  fallback: <TOut extends TParams["_outputSchema"] extends z.ZodType ? TParams["_outputSchema"]["_input"] : any>(
    fn: FallbackFn<TOut>
  ) => AdapterHandlerBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _outputSchema: TParams["_outputSchema"];
    _adapterType: TParams["_adapterType"];
  }>;

  build: () => AdapterHandler<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    outputSchema: TParams["_outputSchema"];
    adapterType: TParams["_adapterType"];
  }>;
}

export interface AnyAdapterHandlerParams {
  _adapterType: AdapterHandlerType;
  _outputSchema?: z.ZodType;
  _handlers: [PredicateFn, AnyVersionHandler][];
  _fallback?: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltAdapterHandlerParams {
  adapterType: AdapterHandlerType;
  handlers: [PredicateFn, AnyVersionHandler][];
  outputSchema?: z.ZodType;
  fallback?: FallbackFn<any>;
}

export type FallbackFn<TOut> = () => TOut;

export interface AdapterHandler<TParams extends AnyBuiltAdapterHandlerParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  outputSchema?: TParams["outputSchema"];
  fallback?: FallbackFn<
    TParams["outputSchema"] extends z.ZodType
      ? TParams["outputSchema"]["_input"]
      : any
  >;
}

export type AnyAdapterHandler = AdapterHandler<any>;
