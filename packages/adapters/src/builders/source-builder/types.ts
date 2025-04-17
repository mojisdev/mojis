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
} from "../source-transformer-builder/types";

export interface PersistenceOptions {
  /**
   * The base path to use for the output files.
   * @default "./data/v<emoji-version>"
   */
  basePath: string;

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
}

export interface PersistenceOperationSchema<
  TName extends string,
  TFilePath extends string,
  TSchema extends type.Any,
> {
  /**
   * The name of the schema.
   * This is used by the `PersistenceOperation["reference"]` property.
   */
  name: TName;

  /**
   * The pattern to use for the file path.
   */
  pattern: string;

  /**
   * The file path to use for the output file.
   */
  filePath: TFilePath;

  /**
   * The type of the file.
   */
  type: "json" | "text";

  /**
   * The schema to use for the data.
   */
  schema: TSchema;
}

type ExtractPathParams<T extends string> =
  T extends `${infer _}{${infer Param}}${infer Rest}`
    ? Param | ExtractPathParams<Rest>
    : never;

export type PathParamsToRecord<T extends string> = {
  [K in ExtractPathParams<T>]: string;
};

export interface PersistenceOperation<
  TSchemaNames extends PersistenceSchema<any>[],
  TData = string | Uint8Array,
  // eslint-disable-next-line ts/no-empty-object-type
  TParams extends Record<string, unknown> = {},
> {
  /**
   * The reference to the schema.
   */
  reference: TSchemaNames[number]["name"];

  /**
   * The parameters for the schema.
   */
  params?: TParams;

  /**
   * The data to write to the file.
   */
  data: TData;
}

// Update PersistenceMapFn to properly constrain reference to schema names
export type PersistenceMapFn<
  TPersistenceSchemas extends PersistenceSchema<any>[],
  TIn,
> = (
  data: TIn,
  options: PersistenceOptions
  // eslint-disable-next-line ts/no-empty-object-type
) => MaybePromise<Array<PersistenceOperation<TPersistenceSchemas, any, {}>>>;

export interface Persistence<
  TIn,
  _TOut,
  TPersistenceSchemas extends PersistenceSchema<string>[],
> {
  /**
   * The schemas to use for the persistence operation.
   */
  schema: TPersistenceSchemas;

  /**
   * The function to map the data to the persistence format.
   */
  map: PersistenceMapFn<TPersistenceSchemas, TIn>;

  /**
   * The options for the persistence operation.
   */
  options?: PersistenceOptions;
}

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
    TPersistenceSchemas extends PersistenceSchema<any>[],
  >(
    fn: TParams["_persistence"] extends UnsetMarker
      ? Persistence<TIn, TOut, TPersistenceSchemas>
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
    options: TParams["_persistenceOptions"] extends UnsetMarker ? TOptions : ErrorMessage<"persistenceOptions is already set">
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
    transformerOutputSchema: TParams["_transformerOutputSchema"];
    persistenceOutputSchema: TParams["_persistenceOutputSchema"];
    persistence: TParams["_persistence"];
    persistenceOptions: TParams["_persistenceOptions"];
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
  _transformerOutputSchema: type.Any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnySourceTransformer][];
  fallback?: FallbackFn<any>;
  persistenceOptions?: PersistenceOptions;
  persistence?: Persistence<any, any, any>;

  persistenceOutputSchema?: type.Any;
  transformerOutputSchema: type.Any;
}

export type FallbackFn<TOut> = () => TOut;

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerOutputSchema: TParams["transformerOutputSchema"];
  persistenceOutputSchema?: TParams["persistenceOutputSchema"];
  fallback?: FallbackFn<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any
  >;
  persistence?: Persistence<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any,
    TParams["persistenceOutputSchema"] extends type.Any
      ? TParams["persistenceOutputSchema"]["infer"]
      : any,
    any
  >;
  persistenceOptions?: TParams["persistenceOptions"];
}

export type AnySourceAdapter = SourceAdapter<any>;
