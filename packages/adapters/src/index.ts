export type { SourceAdapterType as AdapterHandlerType } from "./global-types";

export * as compositeHandlers from "./handlers/composite";
export * as sourceHandlers from "./handlers/source";

export { runCompositeHandler } from "./runners/composite-runner";
export { runSourceAdapter } from "./runners/source-runner";
