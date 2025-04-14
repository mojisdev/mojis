import type { type } from "arktype";
import type {
  ErrorMessage,
  MaybePromise,
  MergeTuple,
  SourceAdapterType,
  UnsetMarker,
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
    _persistenceOptions: TParams["_persistenceOptions"];
  }>;

  fallback: <TOut extends TParams["_transformerSchema"] extends type.Any ? TParams["_transformerSchema"]["infer"] : any>(
    fn: TParams["_fallback"] extends UnsetMarker
      ? FallbackFn<TOut>
      : ErrorMessage<"fallback is already set">
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _transformerSchema: TParams["_transformerSchema"];
    _outputSchema: TParams["_outputSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TParams["_persistence"];
    _persistenceOptions: TParams["_persistenceOptions"];
  }>;

  persistence: <
    TIn extends TParams["_transformerSchema"] extends type.Any ? TParams["_transformerSchema"]["infer"] : any,
    TOut extends TParams["_outputSchema"] extends type.Any ? TParams["_outputSchema"]["infer"] : any,
  >(
    fn: TParams["_persistence"] extends UnsetMarker
      ? PersistenceFn<TIn, TOut>
      : ErrorMessage<"persistence is already set">,
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _outputSchema: TParams["_outputSchema"];
    _transformerSchema: TParams["_transformerSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TOut;
    _persistenceOptions: TParams["_persistenceOptions"];
  }>;

  persistenceOptions: <TOptions extends Omit<PersistenceOptions, "version">>(
    options: TOptions extends UnsetMarker ? TOptions : ErrorMessage<"persistenceOptions is already set">
  ) => SourceAdapterBuilder<{
    _fallback: TParams["_fallback"];
    _handlers: TParams["_handlers"];
    _outputSchema: TParams["_outputSchema"];
    _transformerSchema: TParams["_transformerSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TParams["_persistence"];
    _persistenceOptions: TOptions;
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    outputSchema: TParams["_outputSchema"];
    transformerSchema: TParams["_transformerSchema"];
    adapterType: TParams["_adapterType"];
    persistenceOptions: TParams["_persistenceOptions"];
    persistence: TParams["_persistence"];
  }>;
}

export interface PersistenceOptions {
  /**
   * The base path to use for the output files.
   * @default "./data/v<emoji-version>"
   */
  basePath: string;

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

export interface PersistenceFileOperation<TData = string | Uint8Array> {
  /**
   * The file path to write to.
   */
  filePath: string;

  /**
   * The data to write to the file.
   */
  data: TData;

  /**
   * The type of data being written.
   */
  type: "json" | "text";

  /**
   * The options for the file operation.
   */
  options?: {
    /**
     * For JSON, whether to pretty-print.
     * @default false
     */
    pretty?: boolean;

    /**
     * The encoding to use for the file.
     * @default "utf-8"
     */
    encoding?: BufferEncoding;

    /**
     * Whether to overwrite existing files.
     */
    force?: boolean;
  };
}

export type PersistenceFn<TIn, TOut> = (
  data: TIn,
  options: PersistenceOptions
) => MaybePromise<Array<PersistenceFileOperation<keyof TOut extends never ? unknown : TOut[keyof TOut]>>>;

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _handlers: [PredicateFn, AnyVersionedSourceTransformer][];
  _fallback: any;
  _persistence: any;
  _persistenceOptions: any;

  // schema for persistence output
  _outputSchema: any;

  // schema for the different transformer outputs
  _transformerSchema: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnyVersionedSourceTransformer][];
  transformerSchema?: type.Any;
  outputSchema?: type.Any;
  fallback?: FallbackFn<any>;
  persistence?: PersistenceFn<any, any>;
  persistenceOptions?: Omit<PersistenceOptions, "version">;
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
  persistenceOptions?: TParams["persistenceOptions"];
}

export type AnySourceAdapter = SourceAdapter<any>;
