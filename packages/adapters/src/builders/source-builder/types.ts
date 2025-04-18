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

interface PersistenceSchema {
  pattern: string;
  filePath: string;
  type: "json" | "text";
  schema: type.Any;
}

export interface PersistenceContext {
  /**
   * Persistence Schemas
   */
  schemas: Record<string, PersistenceSchema>;

  /**
   * The persistence options to use.
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
    _adapterType: TParams["_adapterType"];
  }>;

  build: () => SourceAdapter<{
    fallback: TParams["_fallback"];
    handlers: TParams["_handlers"];
    transformerOutputSchema: TParams["_transformerOutputSchema"];
    adapterType: TParams["_adapterType"];
  }>;
}

export interface AnySourceAdapterParams {
  _adapterType: SourceAdapterType;
  _handlers: [PredicateFn, AnySourceTransformer][];
  _fallback: any;

  // schema for transformer output
  _transformerOutputSchema: type.Any;
}

export type PredicateFn = (version: string) => boolean;

export interface AnyBuiltSourceAdapterParams {
  adapterType: SourceAdapterType;
  handlers: [PredicateFn, AnySourceTransformer][];
  fallback?: FallbackFn<any>;
  transformerOutputSchema: type.Any;
}

export type FallbackFn<TOut> = () => TOut;

export interface SourceAdapter<TParams extends AnyBuiltSourceAdapterParams> {
  adapterType: TParams["adapterType"];
  handlers: TParams["handlers"];
  transformerOutputSchema: TParams["transformerOutputSchema"];
  fallback?: FallbackFn<
    TParams["transformerOutputSchema"] extends type.Any
      ? TParams["transformerOutputSchema"]["infer"]
      : any
  >;
}

export type AnySourceAdapter = SourceAdapter<any>;
