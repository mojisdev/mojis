/* eslint-disable ts/explicit-function-return-type */
import type { Cache } from "@mojis/internal-utils";
import type { AnyCompositeHandler } from "../src/builders/composite-builder/types";
import type {
  AnyBuiltSourceAdapterParams,
  AnySourceAdapter,
  SourceAdapter,
} from "../src/builders/source-builder/types";
import type {
  AnyBuiltSourceTransformerParams,
  SourceTransformer,
} from "../src/builders/source-transformer-builder/types";
import type {
  SourceAdapterType,
} from "../src/global-types";
import { createCache } from "@mojis/internal-utils";

export interface SetupAdapterTestOptions {
  cache?: Cache<string>;
}

export async function setupAdapterTest(options?: SetupAdapterTestOptions) {
  const cache = options?.cache ?? createCache<string>({ store: "memory" });

  // use dynamic imports since we can't import from a file
  // since those imports are hoisted to the top of the file
  const { runSourceAdapter: runSourceAdapterOriginal } = await import("../src/runners/source-runner");
  const { runCompositeHandler: runCompositeHandlerOriginal } = await import("../src/runners/composite-runner");

  function runSourceAdapter<THandler extends AnySourceAdapter>(
    ...args: Parameters<typeof runSourceAdapterOriginal<THandler, {
      write: false;
    }>>
  ) {
    const [type, ctx, opts] = args;
    return runSourceAdapterOriginal(type, ctx, {
      write: false,
      ...opts,
      cache: cache as Cache<string>,
    });
  }

  function runCompositeHandler<THandler extends AnyCompositeHandler>(
    ...args: Parameters<typeof runCompositeHandlerOriginal<THandler>>
  ) {
    const [type, ctx, opts] = args;
    return runCompositeHandlerOriginal(type, ctx, {
      ...opts,
      cache: cache as Cache<string>,
    });
  }

  return {
    runSourceAdapter,
    runCompositeHandler,
  };
}

export type WithCustomProperties<
  Base,
  Custom extends Partial<Base>,
> = {
  [K in keyof Base]: K extends keyof Custom
    ? NonNullable<Custom[K]>
    : Base[K]
};

export type CreateSourceAdapter<
  TAdapterType extends SourceAdapterType,
  // eslint-disable-next-line ts/no-empty-object-type
  TConfig extends Partial<Omit<AnyBuiltSourceAdapterParams, "adapterType">> = {},
> = SourceAdapter<
  WithCustomProperties<
    Omit<AnyBuiltSourceAdapterParams, "adapterType">,
    TConfig
  > & { adapterType: TAdapterType }
>;

export type CreateSourceTransformer<
  // eslint-disable-next-line ts/no-empty-object-type
  TParams extends Partial<AnyBuiltSourceTransformerParams> = {},
> = SourceTransformer<
  WithCustomProperties<AnyBuiltSourceTransformerParams, TParams>
>;
