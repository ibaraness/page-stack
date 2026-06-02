import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";

/**
 * Slide transition direction for the page stack outlet.
 *
 * - `1` — forward navigation (new page enters from the right).
 * - `-1` — backward navigation (stack shrinks; page enters from the left).
 */
export type Direction = 1 | -1;

/** Identifies valid pages and the root id every stack must start with. */
export type PageStackConfig<TPageId extends string> = {
  initialPageId: TPageId;
  isValidPageId: (id: string) => id is TPageId;
};

/**
 * Callbacks passed to persistence `initialize` on first mount.
 * Use `setStack` to hydrate the in-memory stack.
 */
export type PageStackInitApi<TPageId extends string> = {
  setStack: Dispatch<SetStateAction<TPageId[]>>;
};

/**
 * Refs and setters shared with persistence during browser back/forward and reset pruning.
 */
export type PageStackPopstateApi<TPageId extends string> = {
  stackRef: RefObject<TPageId[]>;
  setStack: Dispatch<SetStateAction<TPageId[]>>;
  setDirection: Dispatch<SetStateAction<Direction>>;
  pendingPruneAfterGoBackRef: RefObject<boolean>;
  pruneFallbackTimerRef: RefObject<ReturnType<typeof setTimeout> | null>;
};

export type PageStackResetApi<TPageId extends string> = PageStackPopstateApi<TPageId> & {
  initialPageId: TPageId;
  commitStackChange: (ctx: PageStackChangeContext<TPageId>) => void;
};

/**
 * Why the stack changed. Persistence uses this to choose how to save state.
 */
export type PageStackChangeKind =
  | "push"
  | "pop"
  | "replace"
  | "reset-replace"
  | "restore";

export type PageStackChangeContext<TPageId extends string> = {
  previousStack: TPageId[];
  nextStack: TPageId[];
  direction: Direction;
  kind: PageStackChangeKind;
  /** App-defined payload; only interpreted by host persistence (e.g. flow snapshot). */
  meta?: unknown;
};

/**
 * Optional hooks that run beside the in-memory stack (browser history, reducers, storage).
 *
 * Omit entirely for a **headless** stack (e.g. image slider): all navigation mutates React state only.
 *
 * @see createBrowserHistoryPersistence — generic `history.state` binding (stack key only)
 */
export type PageStackPersistence<TPageId extends string> = {
  initialize?: (api: PageStackInitApi<TPageId>) => void;
  commitStackChange?: (ctx: PageStackChangeContext<TPageId>) => void;
  /**
   * Handle `popPage`. When set (browser mode), the engine does **not** pop in memory;
   * persistence should call `history.back()` and later sync via `handlePopState`.
   */
  popPage?: (api: PageStackPopstateApi<TPageId>) => void;
  /**
   * Handle `resetPageStackToRoot` when stack depth > 1.
   * When omitted, reset collapses the stack in memory only.
   */
  resetPageStackToRoot?: (ctx: {
    stepsBack: number;
    api: PageStackResetApi<TPageId>;
  }) => void;
  handlePopState?: (event: PopStateEvent, api: PageStackPopstateApi<TPageId>) => void;
  restoreSavedFlow?: (
    resume: unknown,
    api: PageStackInitApi<TPageId> & {
      setDirection: Dispatch<SetStateAction<Direction>>;
      stackRef: RefObject<TPageId[]>;
    },
  ) => void;
  onCurrentPageChange?: (pageId: TPageId) => void;
};

/**
 * Config + persistence in one object (convenience for `PageStackProvider`).
 * Browser-backed apps should implement `initialize`, `commitStackChange`, and `handlePopState`.
 */
export type PageStackIntegration<TPageId extends string> = PageStackConfig<TPageId> &
  PageStackPersistence<TPageId>;

export type PageStackContextValue<TPageId extends string> = {
  currentPageId: TPageId;
  stackKey: string;
  canGoBack: boolean;
  navigationDirection: Direction;
  pageStack: TPageId[];
  pushPage: (id: TPageId, meta?: unknown) => void;
  /** In-memory: shrinks stack. With browser persistence: delegates to `history.back()`. */
  popPage: () => void;
  resetPageStackToRoot: () => void;
  replacePageStack: (nextStack: TPageId[], meta?: unknown) => void;
  restoreSavedFlow?: (resume: unknown) => void;
};

export type InMemoryPageStackProviderProps<TPageId extends string> = {
  children: ReactNode;
  config: PageStackConfig<TPageId>;
  /** Optional observer (analytics, etc.) — not required for a slider. */
  onNavigate?: (ctx: PageStackChangeContext<TPageId>) => void;
  onCurrentPageChange?: (pageId: TPageId) => void;
};

export type BrowserHistoryPageStackProviderProps<TPageId extends string> = {
  children: ReactNode;
  config: PageStackConfig<TPageId>;
  persistence: PageStackPersistence<TPageId>;
};

/**
 * Props for `PageStackProvider` when config and persistence are passed as one
 * `PageStackIntegration` object (typical for host apps).
 *
 * For split config/persistence, use `BrowserHistoryPageStackProvider` instead.
 */
export type PageStackProviderProps<TPageId extends string> = {
  children: ReactNode;
  integration: PageStackIntegration<TPageId>;
};
