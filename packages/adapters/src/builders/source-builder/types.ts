import type { type } from "arktype";
import type {
  MergeTuple,
  SourceAdapterType,
} from "../../global-types";
import type { AnyVersionedSourceTransformer, AnyVersionedSourceTransformerParams, VersionedSourceTransformerBuilder } from "../version-builder/types";

export type InferHandlerOutput<TSourceAdapter extends AnySourceAdapter> =
  TSourceAdapter extends { handlers: Array<[any, infer TSourceTransformer]> }
    ? TSourceTransformer extends AnyVersionedSourceTransformer
      ? TSourceTransformer["output"]
      : never
    : never;

export interface SourceAdapterBuilder<
  TParams extends AnySourceAdapterParams,
> {
  onVersion: <
    TPredicate extends PredicateFn,
    TBuilderParams extends Omit<AnyVersionedSourceTransformerParams, "_outputSchema"> & {
      _outputSchema: TParams["_outputSchema"] extends type.Any ? TParams["_outputSchema"]["infer"] : any;
    },
    TBuilder extends VersionedSourceTransformerBuilder<TBuilderParams>,
    THandler extends AnyVersionedSourceTransformer,
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
  _handlers: [PredicateFn, AnyVersionedSourceTransformer][];
  _fallback?: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnyVersionedSourceTransformer][];
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
