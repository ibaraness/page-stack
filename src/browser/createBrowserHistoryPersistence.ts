"use client";

import {
  createHistoryStackUtils,
  DEFAULT_HISTORY_STACK_KEY,
} from "../historyStack";
import type {
  PageStackChangeContext,
  PageStackConfig,
  PageStackPersistence,
} from "../types";

export type BrowserHistoryPersistenceConfig<TPageId extends string> = PageStackConfig<TPageId> & {
  /** `history.state` key for the page id array (default `"appStack"`). */
  stackKey?: string;
};

/**
 * Generic browser History API binding — persists only the page id stack on `history.state`.
 *
 * Pair with `BrowserHistoryPageStackProvider`. For session data, reducers, or storage,
 * pass an additional `PageStackPersistence` layer from the host app (see Get Out Of It integration).
 *
 * @example
 * ```tsx
 * <BrowserHistoryPageStackProvider
 *   config={{ initialPageId: "home", isValidPageId: isHomePage }}
 *   persistence={createBrowserHistoryPersistence({ initialPageId: "home", isValidPageId: isHomePage })}
 * />
 * ```
 */
export function createBrowserHistoryPersistence<TPageId extends string>(
  config: BrowserHistoryPersistenceConfig<TPageId>,
): PageStackPersistence<TPageId> {
  const { initialPageId, isValidPageId } = config;
  const { stackKey, sanitizeStack, readStackFromHistory, mergeHistoryState } =
    createHistoryStackUtils({
      initialPageId,
      isValidPageId,
      stackKey: config.stackKey,
    });

  const writeStack = (nextStack: TPageId[], replace: boolean) => {
    const patch = { [stackKey]: nextStack };
    if (replace) {
      window.history.replaceState(mergeHistoryState(patch), "", window.location.href);
    } else {
      window.history.pushState(mergeHistoryState(patch), "", window.location.href);
    }
  };

  return {
    initialize: ({ setStack }) => {
      const fromHistory = readStackFromHistory();
      if (fromHistory) {
        setStack(fromHistory);
        return;
      }
      const initial = [initialPageId] as TPageId[];
      window.history.replaceState(
        mergeHistoryState({ [stackKey]: initial }),
        "",
        window.location.href,
      );
      setStack(initial);
    },

    commitStackChange: (ctx: PageStackChangeContext<TPageId>) => {
      if (ctx.kind === "push" || ctx.kind === "replace") {
        writeStack(ctx.nextStack, false);
        return;
      }
      if (ctx.kind === "reset-replace") {
        writeStack(ctx.nextStack, true);
      }
    },

    popPage: () => {
      window.history.back();
    },

    resetPageStackToRoot: ({ stepsBack }) => {
      window.history.go(-stepsBack);
    },

    handlePopState: (event, api) => {
      const raw = (event.state as Record<string, unknown> | null)?.[stackKey];
      const nextStack = sanitizeStack(raw);
      const prevStackLength = api.stackRef.current.length;

      api.setDirection(nextStack.length < prevStackLength ? -1 : 1);
      api.setStack(nextStack);
      api.stackRef.current = nextStack;

      if (api.pendingPruneAfterGoBackRef.current) {
        if (api.pruneFallbackTimerRef.current) {
          clearTimeout(api.pruneFallbackTimerRef.current);
          api.pruneFallbackTimerRef.current = null;
        }
        api.pendingPruneAfterGoBackRef.current = false;
        const base = [initialPageId] as TPageId[];
        window.history.pushState(
          mergeHistoryState({ [stackKey]: base }),
          "",
          window.location.href,
        );
        api.stackRef.current = base;
        api.setStack(base);
        api.setDirection(1);
      }
    },
  };
}

export { DEFAULT_HISTORY_STACK_KEY };
