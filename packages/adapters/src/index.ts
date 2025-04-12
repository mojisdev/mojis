export type { SourceAdapterType as AdapterHandlerType } from "./global-types";

export * as adapterHandlers from "./handlers/adapter";
export * as compositeHandlers from "./handlers/composite";

export { runSourceAdapter as runAdapterHandler } from "./runners/source-runner";
export { runCompositeHandler } from "./runners/composite-runner";
