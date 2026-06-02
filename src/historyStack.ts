/**
 * Low-level helpers for reading and writing the **page id stack** on `window.history.state`.
 *
 * This module only deals with the stack array (which screens are open). Session payloads,
 * flow snapshots, and reducer sync live in the app integration (`PageStackIntegration.commitStackChange`).
 *
 * Typical usage: call `createHistoryStackUtils` once in your integration, then use the returned
 * helpers inside `initialize`, `commitStackChange`, and `handlePopState`.
 */

function isObjectRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/**
 * Default property name on `history.state` where the generic stack stores page ids.
 */
export const DEFAULT_HISTORY_STACK_KEY = "appStack" as const;

/**
 * Utilities returned by `createHistoryStackUtils` for one page-id type.
 */
export type HistoryStackUtils<TPageId extends string> = {
  /** Key used on `history.state` (default `"appStack"`). */
  stackKey: string;
  /**
   * Coerce unknown data (from `history.state` or storage) into a valid stack.
   * Falls back to `[initialPageId]` if the input is missing or invalid.
   */
  sanitizeStack: (raw: unknown) => TPageId[];
  /**
   * Read the stack from the current `window.history.state`, or `undefined` if none was stored.
   */
  readStackFromHistory: () => TPageId[] | undefined;
  /**
   * Shallow-merge `patch` onto the current `history.state` object.
   * Preserves unrelated keys (e.g. modal state) when the browser already has a state object.
   */
  mergeHistoryState: (patch: Record<string, unknown>) => Record<string, unknown>;
};

/**
 * Factory for stack-related `history.state` helpers.
 *
 * @param config.initialPageId — Root page id (stack must always start with this).
 * @param config.isValidPageId — Rejects unknown strings when sanitizing or reading history.
 * @param config.stackKey — Optional override for `DEFAULT_HISTORY_STACK_KEY`.
 *
 * @example
 * ```ts
 * const { readStackFromHistory, mergeHistoryState, sanitizeStack, stackKey } =
 *   createHistoryStackUtils({ initialPageId: "home", isValidPageId: isHomePage });
 * ```
 */
export function createHistoryStackUtils<TPageId extends string>(config: {
  initialPageId: TPageId;
  isValidPageId: (id: string) => id is TPageId;
  stackKey?: string;
}): HistoryStackUtils<TPageId> {
  const stackKey = config.stackKey ?? DEFAULT_HISTORY_STACK_KEY;

  const sanitizeStack = (raw: unknown): TPageId[] => {
    if (!Array.isArray(raw)) return [config.initialPageId];
    const ids = raw.filter(
      (x): x is TPageId => typeof x === "string" && config.isValidPageId(x),
    );
    if (ids.length === 0) return [config.initialPageId];
    return ids;
  };

  const readStackFromHistory = (): TPageId[] | undefined => {
    const s = window.history.state;
    if (!s || typeof s !== "object" || Array.isArray(s)) return undefined;
    const raw = (s as Record<string, unknown>)[stackKey];
    return raw !== undefined ? sanitizeStack(raw) : undefined;
  };

  const mergeHistoryState = (patch: Record<string, unknown>): Record<string, unknown> => {
    const cur = window.history.state;
    if (isObjectRecord(cur)) {
      return { ...(cur as Record<string, unknown>), ...patch };
    }
    return patch;
  };

  return { stackKey, sanitizeStack, readStackFromHistory, mergeHistoryState };
}
