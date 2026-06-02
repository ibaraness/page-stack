"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  PageStackChangeContext,
  PageStackConfig,
  PageStackContextValue,
  PageStackPersistence,
  PageStackPopstateApi,
} from "./types";

type UsePageStackEngineOptions<TPageId extends string> = {
  config: PageStackConfig<TPageId>;
  persistence?: PageStackPersistence<TPageId>;
  onNavigate?: (ctx: PageStackChangeContext<TPageId>) => void;
};

/**
 * Headless page stack: React state + navigation API only.
 * Attach browser or app behavior via `persistence` (optional).
 */
export function usePageStackEngine<TPageId extends string>({
  config,
  persistence,
  onNavigate,
}: UsePageStackEngineOptions<TPageId>): PageStackContextValue<TPageId> {
  const { initialPageId, isValidPageId } = config;

  const [stack, setStack] = useState<TPageId[]>([initialPageId]);
  const [direction, setDirection] = useState<1 | -1>(1);

  const stackRef = useRef<TPageId[]>([initialPageId]);
  const pendingPruneAfterGoBackRef = useRef(false);
  const pruneFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPageId = stack[stack.length - 1] ?? initialPageId;

  const popstateApi = useMemo<PageStackPopstateApi<TPageId>>(
    () => ({
      stackRef,
      setStack,
      setDirection,
      pendingPruneAfterGoBackRef,
      pruneFallbackTimerRef,
    }),
    [],
  );

  const persistenceRef = useRef(persistence);

  useEffect(() => {
    persistenceRef.current = persistence;
  });

  const notify = useCallback(
    (ctx: PageStackChangeContext<TPageId>) => {
      onNavigate?.(ctx);
      persistenceRef.current?.commitStackChange?.(ctx);
    },
    [onNavigate],
  );

  useLayoutEffect(() => {
    persistenceRef.current?.initialize?.({ setStack });
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      persistenceRef.current?.handlePopState?.(event, popstateApi);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      if (pruneFallbackTimerRef.current) clearTimeout(pruneFallbackTimerRef.current);
      window.removeEventListener("popstate", onPopState);
    };
  }, [popstateApi]);

  useEffect(() => {
    persistenceRef.current?.onCurrentPageChange?.(currentPageId);
  }, [currentPageId]);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const applyStack = useCallback((nextStack: TPageId[], nextDirection: 1 | -1) => {
    stackRef.current = nextStack;
    setDirection(nextDirection);
    setStack(nextStack);
  }, []);

  const pushPage = useCallback(
    (id: TPageId, meta?: unknown) => {
      if (!isValidPageId(id)) return;
      const previousStack = stackRef.current;
      const nextStack = [...previousStack, id];
      const ctx: PageStackChangeContext<TPageId> = {
        previousStack,
        nextStack,
        direction: 1,
        kind: "push",
        meta,
      };
      notify(ctx);
      applyStack(nextStack, 1);
    },
    [applyStack, isValidPageId, notify],
  );

  const popPage = useCallback(() => {
    if (stackRef.current.length <= 1) return;

    if (persistenceRef.current?.popPage) {
      persistenceRef.current.popPage(popstateApi);
      return;
    }

    const previousStack = stackRef.current;
    const nextStack = previousStack.slice(0, -1);
    const ctx: PageStackChangeContext<TPageId> = {
      previousStack,
      nextStack,
      direction: -1,
      kind: "pop",
    };
    notify(ctx);
    applyStack(nextStack, -1);
  }, [applyStack, notify, popstateApi]);

  const replacePageStack = useCallback(
    (nextStack: TPageId[], meta?: unknown) => {
      if (nextStack.length === 0 || nextStack[0] !== initialPageId) return;
      if (!nextStack.every((id) => isValidPageId(id))) return;
      const previousStack = stackRef.current;
      const ctx: PageStackChangeContext<TPageId> = {
        previousStack,
        nextStack,
        direction: 1,
        kind: "replace",
        meta,
      };
      notify(ctx);
      applyStack(nextStack, 1);
    },
    [applyStack, initialPageId, isValidPageId, notify],
  );

  const restoreSavedFlow = useCallback((resume: unknown) => {
    if (!persistenceRef.current?.restoreSavedFlow) return;
    persistenceRef.current.restoreSavedFlow(resume, {
      setStack,
      setDirection,
      stackRef,
    });
  }, []);

  const resetPageStackToRoot = useCallback(() => {
    const target = initialPageId;
    const previousStack = stackRef.current;

    if (previousStack.length <= 1) {
      const nextStack = [target] as TPageId[];
      const ctx: PageStackChangeContext<TPageId> = {
        previousStack,
        nextStack,
        direction: 1,
        kind: "reset-replace",
      };
      notify(ctx);
      if (previousStack[0] === target) return;
      applyStack(nextStack, 1);
      return;
    }

    const stepsBack = previousStack.length - 1;

    if (persistenceRef.current?.resetPageStackToRoot) {
      pendingPruneAfterGoBackRef.current = true;
      if (pruneFallbackTimerRef.current) clearTimeout(pruneFallbackTimerRef.current);
      pruneFallbackTimerRef.current = setTimeout(() => {
        pruneFallbackTimerRef.current = null;
        pendingPruneAfterGoBackRef.current = false;
      }, 400);

      persistenceRef.current.resetPageStackToRoot({
        stepsBack,
        api: {
          ...popstateApi,
          initialPageId,
          commitStackChange: (ctx) => notify(ctx),
        },
      });
      return;
    }

    const nextStack = [target] as TPageId[];
    const ctx: PageStackChangeContext<TPageId> = {
      previousStack,
      nextStack,
      direction: -1,
      kind: "pop",
    };
    notify(ctx);
    applyStack(nextStack, -1);
  }, [applyStack, initialPageId, notify, popstateApi]);

  return useMemo<PageStackContextValue<TPageId>>(
    () => ({
      currentPageId,
      stackKey: stack.join("/"),
      canGoBack: stack.length > 1,
      navigationDirection: direction,
      pageStack: stack,
      pushPage,
      popPage,
      resetPageStackToRoot,
      replacePageStack,
      ...(persistence?.restoreSavedFlow ? { restoreSavedFlow } : {}),
    }),
    [
      currentPageId,
      stack,
      direction,
      pushPage,
      popPage,
      resetPageStackToRoot,
      replacePageStack,
      restoreSavedFlow,
      persistence,
    ],
  );
}
