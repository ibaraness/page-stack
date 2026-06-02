import { describe, expect, it, vi } from "vitest";
import { mergePageStackPersistence } from "./mergePageStackPersistence";
import type { PageStackPersistence } from "../types";

describe("mergePageStackPersistence", () => {
  it("returns base when overlay is omitted", () => {
    const base: PageStackPersistence<"a"> = { initialize: vi.fn() };
    expect(mergePageStackPersistence(base)).toBe(base);
  });

  it("calls initialize on base then overlay", () => {
    const baseInit = vi.fn();
    const overlayInit = vi.fn();
    const merged = mergePageStackPersistence(
      { initialize: baseInit },
      { initialize: overlayInit },
    );
    const api = { setStack: vi.fn() };
    merged.initialize?.(api);
    expect(baseInit).toHaveBeenCalledWith(api);
    expect(overlayInit).toHaveBeenCalledWith(api);
  });

  it("calls commitStackChange on both layers", () => {
    const baseCommit = vi.fn();
    const overlayCommit = vi.fn();
    const merged = mergePageStackPersistence(
      { commitStackChange: baseCommit },
      { commitStackChange: overlayCommit },
    );
    const ctx = {
      previousStack: ["a"],
      nextStack: ["a", "b"],
      direction: 1 as const,
      kind: "push" as const,
    };
    merged.commitStackChange?.(ctx);
    expect(baseCommit).toHaveBeenCalledWith(ctx);
    expect(overlayCommit).toHaveBeenCalledWith(ctx);
  });

  it("prefers overlay popPage over base", () => {
    const basePop = vi.fn();
    const overlayPop = vi.fn();
    const merged = mergePageStackPersistence(
      { popPage: basePop },
      { popPage: overlayPop },
    );
    merged.popPage?.({} as never);
    expect(overlayPop).toHaveBeenCalled();
    expect(basePop).not.toHaveBeenCalled();
  });

  it("falls back to base popPage when overlay omits it", () => {
    const basePop = vi.fn();
    const merged = mergePageStackPersistence({ popPage: basePop }, {});
    merged.popPage?.({} as never);
    expect(basePop).toHaveBeenCalled();
  });

  it("calls onCurrentPageChange on both layers", () => {
    const baseChange = vi.fn();
    const overlayChange = vi.fn();
    const merged = mergePageStackPersistence(
      { onCurrentPageChange: baseChange },
      { onCurrentPageChange: overlayChange },
    );
    merged.onCurrentPageChange?.("a");
    expect(baseChange).toHaveBeenCalledWith("a");
    expect(overlayChange).toHaveBeenCalledWith("a");
  });
});
