export type { SourceAdapterType as AdapterHandlerType } from "./global-types";

export * as adapterHandlers from "./handlers/adapter";
export * as compositeHandlers from "./handlers/composite";

export { runCompositeHandler } from "./runners/composite-runner";
export { runSourceAdapter } from "./runners/source-runner";
