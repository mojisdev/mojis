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
   * Whether to pretty-print the if `output` is JSON.
   * @default false
   */
  pretty?: boolean;

  /**
   * The encoding to use when writing files.
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
}

type ExtractParams<T> = T extends `${string}{${infer P}}${infer R}`
  ? P | ExtractParams<R>
  : never;

type GetParams<T extends string> = ExtractParams<T> extends never
  ? never
  : { [K in ExtractParams<T>]: string };

type SchemaOperation<T extends PersistenceSchema> = {
  reference: T;
  data: T["schema"]["infer"];
} & (GetParams<T["filePath"]> extends never
  ? { params?: undefined }
  : { params: GetParams<T["filePath"]> });

type ValidSchemaOp<TContext extends PersistenceContext> = {
  [K in keyof TContext["schemas"]]: SchemaOperation<TContext["schemas"][K]>;
}[keyof TContext["schemas"]];

export interface PersistenceSchema {
  pattern: string;
  filePath: string;
  type: "json" | "text";
  schema: type.Any;
}

export interface PersistenceContext<TSchemas extends Record<string, PersistenceSchema> = Record<string, PersistenceSchema>> {
  schemas: TSchemas;
  options?: PersistenceOptions;
}

export type PersistenceMapFn<
  TContext extends PersistenceContext,
  TIn,
  TOut extends ValidSchemaOp<TContext>,
> = (
  references: TContext["schemas"],
  data: TIn
) => MaybePromise<Array<TOut>>;

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
    _handlers: MergeTuple<
      [[TPredicate, THandler]],
      TParams["_handlers"]
    >;
    _fallback: TParams["_fallback"];
    _persistence: TParams["_persistence"];
    _persistenceMapFn: TParams["_persistenceMapFn"];
  }>;

  fallback: <TOut extends TParams["_transformerOutputSchema"] extends type.Any ? TParams["_transformerOutputSchema"]["infer"] : any>(
    fn: TParams["_fallback"] extends UnsetMarker
      ? FallbackFn<TOut>
      : ErrorMessage<"fallback is already set">,
  ) => SourceAdapterBuilder<{
    _fallback: TOut;
    _handlers: TParams["_handlers"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _adapterType: TParams["_adapterType"];
    _persistence: TParams["_persistence"];
    _persistenceMapFn: TParams["_persistenceMapFn"];
  }>;

  toPersistenceOperations: <
    TIn extends TParams["_transformerOutputSchema"]["infer"],
    TOut extends ValidSchemaOp<TParams["_persistence"]>,
  >(
    fn: PersistenceMapFn<TParams["_persistence"], TIn, TOut>
  ) => SourceAdapterBuilder<{
    _adapterType: TParams["_adapterType"];
    _transformerOutputSchema: TParams["_transformerOutputSchema"];
    _handlers: TParams["_handlers"];
    _fallback: TParams["_fallback"];
    _persistence: TParams["_persistence"];
    _persistenceMapFn: TOut;
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    transformerOutputSchema: TParams["_transformerOutputSchema"];
    adapterType: TParams["_adapterType"];
    persistence: TParams["_persistence"];
    persistenceMapFn: TParams["_persistenceMapFn"];
  }>;
}

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _handlers: [PredicateFn, AnySourceTransformer][];
  _fallback: any;

  // schema for transformer output
  _transformerOutputSchema: type.Any;

  _persistence: PersistenceContext;
  _persistenceMapFn: any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnySourceTransformer][];
  fallback: any;
  transformerOutputSchema: type.Any;
  persistence: PersistenceContext;
  persistenceMapFn: any;
}

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerOutputSchema: TParams["transformerOutputSchema"];
  fallback: TParams["transformerOutputSchema"]["infer"];
  persistence: TParams["persistence"];
  persistenceMapFn: PersistenceMapFn<TParams["persistence"], TParams["transformerOutputSchema"]["infer"], TParams["persistenceMapFn"]>;
}

export type AnySourceAdapter = SourceAdapter<any>;
