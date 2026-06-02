import type { PageStackPersistence } from "../types";

/**
 * Layer host persistence on top of a base (e.g. browser stack + app session trace).
 * Overlay methods override base; omitted keys fall through to base.
 */
export function mergePageStackPersistence<TPageId extends string>(
  base: PageStackPersistence<TPageId>,
  overlay?: PageStackPersistence<TPageId>,
): PageStackPersistence<TPageId> {
  if (!overlay) return base;

  return {
    initialize: (api) => {
      base.initialize?.(api);
      overlay.initialize?.(api);
    },
    commitStackChange: (ctx) => {
      base.commitStackChange?.(ctx);
      overlay.commitStackChange?.(ctx);
    },
    popPage: (api) => {
      if (overlay.popPage) {
        overlay.popPage(api);
        return;
      }
      base.popPage?.(api);
    },
    resetPageStackToRoot: (ctx) => {
      if (overlay.resetPageStackToRoot) {
        overlay.resetPageStackToRoot(ctx);
        return;
      }
      base.resetPageStackToRoot?.(ctx);
    },
    handlePopState: (event, api) => {
      base.handlePopState?.(event, api);
      overlay.handlePopState?.(event, api);
    },
    restoreSavedFlow: (resume, api) => {
      if (overlay.restoreSavedFlow) {
        overlay.restoreSavedFlow(resume, api);
        return;
      }
      base.restoreSavedFlow?.(resume, api);
    },
    onCurrentPageChange: (pageId) => {
      base.onCurrentPageChange?.(pageId);
      overlay.onCurrentPageChange?.(pageId);
    },
  };
}
