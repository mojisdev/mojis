/* eslint-disable ts/consistent-type-definitions */
/* eslint-disable ts/no-empty-object-type */

import type { AdapterHandler, AnyAdapterHandler } from "../../src/builders/adapter-builder/types";
import type {
  MergeSources,
} from "../../src/builders/composite-builder/types";
import type { AnyVersionHandler, VersionHandler } from "../../src/builders/version-builder/types";
import { describe, expectTypeOf, it } from "vitest";

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type OverrideVersionHandler<
  TBaseHandler extends AnyVersionHandler,
  TOverrides extends Partial<{
    [K in keyof VersionHandler<any>]: any;
  }>,
> = Omit<TBaseHandler, keyof TOverrides> & TOverrides;

export type OverrideAdapterHandler<
  TBaseHandler extends AnyAdapterHandler,
  TOverrides extends Partial<{
    [K in keyof AdapterHandler<any>]: any;
  }>,
> = Omit<TBaseHandler, keyof TOverrides> & TOverrides;

describe("MergeSources", () => {
  it("should handle empty sources", () => {
    type Source1 = {};
    type Source2 = [];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{}>();
  });

  it("should merge sources with same keys", () => {
    type Source1 = {
      version: () => string;
      hello: () => string;
    };

    type Source2 = [
      {
        adapterType: "version";
        handlers: [
          [() => true, OverrideVersionHandler<AnyVersionHandler, {
            output: string;
          }>],
        ];
      },
      {
        adapterType: "world";
        handlers: [
          [() => true, OverrideVersionHandler<AnyVersionHandler, {
            output: string;
          }>],
        ];
      },
    ];

    type Result = MergeSources<Source1, Source2>;

    expectTypeOf<Result>().toEqualTypeOf<{
      version: string;
      hello: string;
      world: string;
    }>();
  });
});
