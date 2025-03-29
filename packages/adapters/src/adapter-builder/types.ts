import type { z } from "zod";
import type {
  AdapterHandlerType,
  JoinTuples,
} from "../global-types";
import type { AnyHandleVersionParams, AnyVersionHandler, HandleVersionBuilder } from "../version-builder/types";

export type InferHandlerOutput<TAdapterHandler extends AnyAdapterHandler> = TAdapterHandler extends AdapterHandler<infer TParams>
  ? TParams["handlers"][number]["1"]["output"]
  : never;

export interface AdapterHandlerBuilder<
  TParams extends AnyAdapterHandlerParams,
> {
  onVersion: <
    TPredicate extends PredicateFn,
    TBuilderParams extends Omit<AnyHandleVersionParams, "_outputSchema"> & {
      _outputSchema: TParams["_outputSchema"]["_input"];
    },
    TBuilder extends HandleVersionBuilder<TBuilderParams>,
    THandler extends AnyVersionHandler,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => AdapterHandlerBuilder<{
    _type: TParams["_type"];
    _outputSchema: TParams["_outputSchema"];
    _handlers: JoinTuples<TParams["_handlers"], [[TPredicate, THandler]]>;
  }>;
  build: () => AnyAdapterHandler;
}

export interface AnyAdapterHandlerParams {
  _type: AdapterHandlerType;
  _outputSchema: z.ZodType;
  _handlers: [PredicateFn, AnyVersionHandler][];
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltAdapterHandlerParams {
  type: AdapterHandlerType;
  handlers: [PredicateFn, AnyVersionHandler][];
  outputSchema: z.ZodType;
}

export interface AdapterHandler<TParams extends AnyBuiltAdapterHandlerParams> {
  adapterType: TParams["type"];
  handlers: TParams["handlers"];
  outputSchema: TParams["outputSchema"];
}

export type AnyAdapterHandler = AdapterHandler<any>;
