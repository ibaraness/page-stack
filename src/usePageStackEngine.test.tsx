import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePageStackEngine } from "./usePageStackEngine";

type PageId = "home" | "profile" | "settings";
const isPageId = (id: string): id is PageId =>
  id === "home" || id === "profile" || id === "settings";

const config = { initialPageId: "home" as const, isValidPageId: isPageId };

describe("usePageStackEngine", () => {
  it("starts on initialPageId with no back navigation", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    expect(result.current.currentPageId).toBe("home");
    expect(result.current.pageStack).toEqual(["home"]);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.stackKey).toBe("home");
  });

  it("pushPage appends valid pages and sets forward direction", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => result.current.pushPage("profile"));
    expect(result.current.pageStack).toEqual(["home", "profile"]);
    expect(result.current.currentPageId).toBe("profile");
    expect(result.current.navigationDirection).toBe(1);
    expect(result.current.canGoBack).toBe(true);
  });

  it("ignores pushPage for invalid ids", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => result.current.pushPage("invalid" as PageId));
    expect(result.current.pageStack).toEqual(["home"]);
  });

  it("popPage removes the last page in memory", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => {
      result.current.pushPage("profile");
      result.current.popPage();
    });
    expect(result.current.pageStack).toEqual(["home"]);
    expect(result.current.navigationDirection).toBe(-1);
  });

  it("popPage is a no-op on root", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => result.current.popPage());
    expect(result.current.pageStack).toEqual(["home"]);
  });

  it("replacePageStack replaces when stack starts with initialPageId", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => result.current.replacePageStack(["home", "settings"]));
    expect(result.current.pageStack).toEqual(["home", "settings"]);
    expect(result.current.currentPageId).toBe("settings");
  });

  it("replacePageStack rejects stacks that do not start at initialPageId", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => result.current.replacePageStack(["profile", "settings"]));
    expect(result.current.pageStack).toEqual(["home"]);
  });

  it("resetPageStackToRoot collapses to root in memory", () => {
    const { result } = renderHook(() => usePageStackEngine({ config }));
    act(() => {
      result.current.pushPage("profile");
      result.current.pushPage("settings");
      result.current.resetPageStackToRoot();
    });
    expect(result.current.pageStack).toEqual(["home"]);
    expect(result.current.currentPageId).toBe("home");
  });

  it("delegates popPage to persistence without shrinking stack in memory", () => {
    const popPage = vi.fn();
    const { result } = renderHook(() =>
      usePageStackEngine({ config, persistence: { popPage } }),
    );
    act(() => {
      result.current.pushPage("profile");
      result.current.popPage();
    });
    expect(popPage).toHaveBeenCalled();
    expect(result.current.pageStack).toEqual(["home", "profile"]);
  });

  it("notifies onNavigate with change context", () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => usePageStackEngine({ config, onNavigate }));
    act(() => result.current.pushPage("profile"));
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "push",
        previousStack: ["home"],
        nextStack: ["home", "profile"],
        direction: 1,
      }),
    );
  });
});
