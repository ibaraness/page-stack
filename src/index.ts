/**
 * Portable page stack — copy this entire folder into another project.
 *
 * @see README.md — setup, peer dependencies, and usage
 */
export {
  InMemoryPageStackProvider,
  BrowserHistoryPageStackProvider,
  PageStackProvider,
  usePageStackCore,
  usePageStackCoreOptional,
} from "./PageStackContext";
export { PageStackOutlet } from "./PageStackOutlet";
export { usePageStackEngine } from "./usePageStackEngine";
export { createBrowserHistoryPersistence } from "./browser/createBrowserHistoryPersistence";
export { mergePageStackPersistence } from "./browser/mergePageStackPersistence";
export {
  createHistoryStackUtils,
  DEFAULT_HISTORY_STACK_KEY,
} from "./historyStack";
export { slideTransition, slideVariants } from "./slideTransition";
export type {
  Direction,
  PageStackChangeContext,
  PageStackChangeKind,
  PageStackConfig,
  PageStackContextValue,
  PageStackIntegration,
  PageStackPersistence,
  PageStackProviderProps,
  InMemoryPageStackProviderProps,
  BrowserHistoryPageStackProviderProps,
} from "./types";
