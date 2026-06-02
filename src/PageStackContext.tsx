"use client";

/**
 * Page stack providers built on `usePageStackEngine` (headless React state).
 *
 * | Provider | History API | Use case |
 * |----------|-------------|----------|
 * | `InMemoryPageStackProvider` | No | Sliders, wizards, previews |
 * | `BrowserHistoryPageStackProvider` | Yes | Apps that sync stack to `history.state` |
 * | `PageStackProvider` | Yes | Alias: browser + full `PageStackIntegration` |
 *
 * @see usePageStackEngine
 * @see browser/createBrowserHistoryPersistence
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePageStackEngine } from "./usePageStackEngine";
import type {
  BrowserHistoryPageStackProviderProps,
  InMemoryPageStackProviderProps,
  PageStackContextValue,
  PageStackIntegration,
  PageStackProviderProps,
} from "./types";

const PageStackContext = createContext<PageStackContextValue<string> | null>(null);

function PageStackContextProvider<TPageId extends string>({
  value,
  children,
}: {
  value: PageStackContextValue<TPageId>;
  children: ReactNode;
}) {
  return (
    <PageStackContext.Provider value={value as unknown as PageStackContextValue<string>}>
      {children}
    </PageStackContext.Provider>
  );
}

/**
 * Headless stack — navigation is in-memory only (e.g. image slider, stepped UI).
 * `popPage` removes the last entry from React state; browser URL does not change.
 */
export function InMemoryPageStackProvider<TPageId extends string>({
  children,
  config,
  onNavigate,
  onCurrentPageChange,
}: InMemoryPageStackProviderProps<TPageId>) {
  const persistence = useMemo(
    () => (onCurrentPageChange ? { onCurrentPageChange } : undefined),
    [onCurrentPageChange],
  );

  const value = usePageStackEngine({
    config,
    onNavigate,
    persistence,
  });

  return <PageStackContextProvider value={value}>{children}</PageStackContextProvider>;
}

/**
 * Stack synced to the browser History API via `persistence`
 * (use `createBrowserHistoryPersistence` for stack-only, or a host-specific layer).
 */
export function BrowserHistoryPageStackProvider<TPageId extends string>({
  children,
  config,
  persistence,
}: BrowserHistoryPageStackProviderProps<TPageId>) {
  const value = usePageStackEngine({ config, persistence });
  return <PageStackContextProvider value={value}>{children}</PageStackContextProvider>;
}

/**
 * Browser history + full integration object (config and persistence fields together).
 * Used by Get Out Of It via `navigation/PageStackContext.tsx`.
 */
export function PageStackProvider<TPageId extends string>({
  children,
  integration,
}: PageStackProviderProps<TPageId>) {
  const config = useMemo(
    () => ({
      initialPageId: integration.initialPageId,
      isValidPageId: integration.isValidPageId,
    }),
    [integration.initialPageId, integration.isValidPageId],
  );

  return (
    <BrowserHistoryPageStackProvider config={config} persistence={integration}>
      {children}
    </BrowserHistoryPageStackProvider>
  );
}

export function usePageStackCore<TPageId extends string>(): PageStackContextValue<TPageId> {
  const ctx = useContext(PageStackContext);
  if (!ctx) {
    throw new Error("usePageStackCore must be used within a page stack provider");
  }
  return ctx as unknown as PageStackContextValue<TPageId>;
}

export function usePageStackCoreOptional<TPageId extends string>():
  | PageStackContextValue<TPageId>
  | null {
  const ctx = useContext(PageStackContext);
  return ctx as unknown as PageStackContextValue<TPageId> | null;
}

export type { PageStackIntegration };
