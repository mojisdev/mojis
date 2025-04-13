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
    TBuilderParams extends Omit<AnyVersionedSourceTransformerParams, "_transformerSchema"> & {
      _outputSchema: TParams["_transformerSchema"] extends type.Any ? TParams["_transformerSchema"]["infer"] : any;
    },
    TBuilder extends VersionedSourceTransformerBuilder<TBuilderParams>,
    THandler extends AnyVersionedSourceTransformer,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => SourceAdapterBuilder<{
    _adapterType: TParams["_adapterType"];
    _outputSchema: TParams["_outputSchema"];
    _transformerSchema: TParams["_transformerSchema"];
    _handlers: MergeTuple<
      [[TPredicate, THandler]],
      TParams["_handlers"]
    >;
    _fallback: TParams["_fallback"];
    _persistence: TParams["_persistence"];
  }>;

  fallback: <TOut extends TParams["_transformerSchema"] extends type.Any ? TParams["_transformerSchema"]["infer"] : any>(
    fn: FallbackFn<TOut>
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _transformerSchema: TParams["_transformerSchema"];
    _outputSchema: TParams["_outputSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TParams["_persistence"];
  }>;

  persistence: <TOut extends TParams["_outputSchema"] extends type.Any ? TParams["_outputSchema"]["infer"] : any>(
    fn: FallbackFn<TOut>
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _outputSchema: TParams["_outputSchema"];
    _transformerSchema: TParams["_transformerSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TOut;
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    outputSchema: TParams["_outputSchema"];
    transformerSchema: TParams["_transformerSchema"];
    adapterType: TParams["_adapterType"];
  }>;
}

export interface PersistenceOptions {
  /**
   * Whether to force overwrite of existing files.
   * @default false
   */
  force?: boolean;

  /**
   * Version information for the emoji data.
   */
  version: {
    /**
     * The emoji version.
     */
    emoji_version: string;

    /**
     * The unicode version.
     */
    unicode_version: string;
  };

  /**
   * Whether to pretty-print the output JSON.
   * @default false
   */
  pretty?: boolean;

  /**
   * The file extension to use for the output files.
   * @default "json"
   */
  fileExtension?: string;

  /**
   * The encoding to use when writing files.
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
}

export type PersistenceFn<TIn, TOut> = (data: TIn, options: PersistenceOptions) => Promise<TOut>;

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _outputSchema: type.Any;
  _transformerSchema: type.Any;
  _handlers: [PredicateFn, AnyVersionedSourceTransformer][];
  _fallback: any;
  _persistence: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnyVersionedSourceTransformer][];
  transformerSchema: type.Any;
  outputSchema: type.Any;
  fallback?: FallbackFn<any>;
  persistence?: PersistenceFn<any, any>;
}

export type FallbackFn<TOut> = () => TOut;

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerSchema: TParams["transformerSchema"];
  outputSchema: TParams["outputSchema"];
  fallback?: FallbackFn<
    TParams["transformerSchema"] extends type.Any
      ? TParams["transformerSchema"]["infer"]
      : any
  >;
  persistence?: PersistenceFn<
    TParams["transformerSchema"] extends type.Any
      ? TParams["transformerSchema"]["infer"]
      : any,
    TParams["outputSchema"] extends type.Any
      ? TParams["outputSchema"]["infer"]
      : any
  >;
}

export type AnySourceAdapter = SourceAdapter<any>;
