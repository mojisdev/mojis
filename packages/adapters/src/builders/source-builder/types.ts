import type { type } from "arktype";
import type {
  MergeTuple,
  SourceAdapterType,
} from "../../global-types";
import type { AnySourceTransformer, AnySourceTransformerParams, SourceTransformerBuilder } from "../version-builder/types";

export type InferHandlerOutput<TSourceAdapter extends AnySourceAdapter> =
  TSourceAdapter extends { handlers: Array<[any, infer TSourceTransformer]> }
    ? TSourceTransformer extends AnySourceTransformer
      ? TSourceTransformer["output"]
      : never
    : never;

export interface SourceAdapterBuilder<
  TParams extends AnySourceAdapterParams,
> {
  withTransform: <
    TPredicate extends PredicateFn,
    TBuilderParams extends Omit<AnySourceTransformerParams, "_outputSchema"> & {
      _outputSchema: TParams["_outputSchema"] extends type.Any ? TParams["_outputSchema"]["infer"] : any;
    },
    TBuilder extends SourceTransformerBuilder<TBuilderParams>,
    THandler extends AnySourceTransformer,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => SourceAdapterBuilder<{
    _adapterType: TParams["_adapterType"];
    _outputSchema: TParams["_outputSchema"];
    _handlers: MergeTuple<
      [[TPredicate, THandler]],
      TParams["_handlers"]
    >;
    _fallback: TParams["_fallback"];
  }>;

  fallback: <TOut extends TParams["_outputSchema"] extends type.Any ? TParams["_outputSchema"]["infer"] : any>(
    fn: FallbackFn<TOut>
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _outputSchema: TParams["_outputSchema"];
    _adapterType: TParams["_adapterType"];
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    outputSchema: TParams["_outputSchema"];
    adapterType: TParams["_adapterType"];
  }>;
}

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _outputSchema?: type.Any;
  _handlers: [PredicateFn, AnySourceTransformer][];
  _fallback?: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnySourceTransformer][];
  outputSchema?: type.Any;
  fallback?: FallbackFn<any>;
}

export type FallbackFn<TOut> = () => TOut;

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  outputSchema?: TParams["outputSchema"];
  fallback?: FallbackFn<
    TParams["outputSchema"] extends type.Any
      ? TParams["outputSchema"]["infer"]
      : any
  >;
}

export type AnySourceAdapter = SourceAdapter<any>;
