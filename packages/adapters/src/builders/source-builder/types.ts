import type { type } from "arktype";
import type {
  ErrorMessage,
  MaybePromise,
  MergeTuple,
  SourceAdapterType,
  UnsetMarker,
} from "../../global-types";
import type {
  AnySourceTransformer,
  AnySourceTransformerParams,
  SourceTransformerBuilder,
} from "../version-builder/types";

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
      _outputSchema: TParams["_transformerOutputSchema"] extends type.Any ? TParams["_transformerOutputSchema"]["infer"] : any;
    },
    TBuilder extends SourceTransformerBuilder<TBuilderParams>,
    THandler extends AnySourceTransformer,
  >(
    predicate: TPredicate,
    builder: (builder: TBuilder) => THandler,
  ) => SourceAdapterBuilder<{
    _adapterType: TParams["_adapterType"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _persistenceOutputSchema: TParams["_persistenceOutputSchema"];
    _persistence: TParams["_persistence"];
    _persistenceOptions: TParams["_persistenceOptions"];
    _handlers: MergeTuple<
      [[TPredicate, THandler]],
      TParams["_handlers"]
    >;
    _fallback: TParams["_fallback"];
  }>;

  fallback: <TOut extends TParams["_transformerOutputSchema"] extends type.Any ? TParams["_transformerOutputSchema"]["infer"] : any>(
    fn: TParams["_fallback"] extends UnsetMarker
      ? FallbackFn<TOut>
      : ErrorMessage<"fallback is already set">,
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _persistenceOutputSchema: TParams["_persistenceOutputSchema"];
    _persistence: TParams["_persistence"];
    _persistenceOptions: TParams["_persistenceOptions"];
    _adapterType: TParams["_adapterType"];
  }>;

  persistence: <
    TIn extends TParams["_transformerOutputSchema"] extends type.Any ? TParams["_transformerOutputSchema"]["infer"] : any,
    TOut extends TParams["_persistenceOutputSchema"] extends type.Any ? TParams["_persistenceOutputSchema"]["infer"] : any,
  >(
    fn: TParams["_persistence"] extends UnsetMarker
      ? PersistenceFn<TIn, TOut>
      : ErrorMessage<"persistence is already set">,
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _persistenceOutputSchema: TParams["_persistenceOutputSchema"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TOut;
    _persistenceOptions: TParams["_persistenceOptions"];
  }>;

  persistenceOptions: <TOptions extends Omit<PersistenceOptions, "version">>(
    options: TOptions extends UnsetMarker ? TOptions : ErrorMessage<"persistenceOptions is already set">
  ) => SourceAdapterBuilder<{
    _fallback: TParams["_fallback"];
    _handlers: TParams["_handlers"];
    _persistenceOutputSchema: TParams["_persistenceOutputSchema"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TParams["_persistence"];
    _persistenceOptions: TOptions;
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    outputSchema: TParams["_transformerOutputSchema"];
    adapterType: TParams["_adapterType"];
  }>;
}

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _handlers: [PredicateFn, AnySourceTransformer][];
  _fallback: any;
  _persistence: any;
  _persistenceOptions: any;

  // schema for persistence output
  _persistenceOutputSchema?: type.Any;

  // schema for transformer output
  _transformerOutputSchema?: type.Any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnySourceTransformer][];
  transformerOutputSchema?: type.Any;
  fallback?: FallbackFn<any>;
  persistenceOutputSchema?: type.Any;
  persistence?: PersistenceFn<any, any>;
  persistenceOptions?: PersistenceOptions;
}

export type FallbackFn<TOut> = () => TOut;

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerOutputSchema?: TParams["transformerOutputSchema"];
  persistenceOutputSchema?: TParams["persistenceOutputSchema"];
  fallback?: FallbackFn<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any
  >;
  persistence?: PersistenceFn<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any,
    TParams["persistenceOutputSchema"] extends type.Any
      ? TParams["persistenceOutputSchema"]["infer"]
      : any
  >;
  persistenceOptions?: TParams["persistenceOptions"];
}

export type AnySourceAdapter = SourceAdapter<any>;
