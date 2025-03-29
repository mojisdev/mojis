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
    TBuilderParams extends AnyHandleVersionParams,
    TBuilder extends HandleVersionBuilder<TBuilderParams>,
    THandler extends AnyVersionHandler,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => AdapterHandlerBuilder<{
    _type: TParams["_type"];
    _handlers: JoinTuples<TParams["_handlers"], [[TPredicate, THandler]]>;
  }>;
  build: () => AdapterHandler<{
    type: TParams["_type"];
    handlers: TParams["_handlers"];
  }>;
}

export interface AnyAdapterHandlerParams {
  _type: AdapterHandlerType;
  _handlers: [PredicateFn, AnyVersionHandler][];
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltAdapterHandlerParams {
  type: AdapterHandlerType;
  handlers: [PredicateFn, AnyVersionHandler][];
}

export interface AdapterHandler<TParams extends AnyBuiltAdapterHandlerParams> {
  adapterType: TParams["type"];
  handlers: TParams["handlers"];
}

export type AnyAdapterHandler = AdapterHandler<any>;
