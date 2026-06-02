import { describe, expect, it, afterEach, vi } from "vitest";
import { createBrowserHistoryPersistence } from "./createBrowserHistoryPersistence";
import { DEFAULT_HISTORY_STACK_KEY } from "../historyStack";
import { installHistoryMock } from "../test/historyMock";

type PageId = "home" | "profile";
const isPageId = (id: string): id is PageId => id === "home" || id === "profile";

const config = { initialPageId: "home" as const, isValidPageId: isPageId };

describe("createBrowserHistoryPersistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initialize hydrates from history.state when present", () => {
    installHistoryMock({ [DEFAULT_HISTORY_STACK_KEY]: ["home", "profile"] });
    const persistence = createBrowserHistoryPersistence(config);
    const setStack = vi.fn();
    persistence.initialize?.({ setStack });
    expect(setStack).toHaveBeenCalledWith(["home", "profile"]);
  });

  it("initialize seeds history when stack is missing", () => {
    const history = installHistoryMock(null);
    const persistence = createBrowserHistoryPersistence(config);
    const setStack = vi.fn();
    persistence.initialize?.({ setStack });
    expect(history.replaceState).toHaveBeenCalled();
    expect(history.state).toEqual({ [DEFAULT_HISTORY_STACK_KEY]: ["home"] });
    expect(setStack).toHaveBeenCalledWith(["home"]);
  });

  it("commitStackChange push uses pushState", () => {
    const history = installHistoryMock({ [DEFAULT_HISTORY_STACK_KEY]: ["home"] });
    const persistence = createBrowserHistoryPersistence(config);
    persistence.commitStackChange?.({
      previousStack: ["home"],
      nextStack: ["home", "profile"],
      direction: 1,
      kind: "push",
    });
    expect(history.pushState).toHaveBeenCalledWith(
      { [DEFAULT_HISTORY_STACK_KEY]: ["home", "profile"] },
      "",
      "http://localhost/",
    );
  });

  it("commitStackChange reset-replace uses replaceState", () => {
    const history = installHistoryMock({
      [DEFAULT_HISTORY_STACK_KEY]: ["home", "profile"],
    });
    const persistence = createBrowserHistoryPersistence(config);
    persistence.commitStackChange?.({
      previousStack: ["home", "profile"],
      nextStack: ["home"],
      direction: 1,
      kind: "reset-replace",
    });
    expect(history.replaceState).toHaveBeenCalledWith(
      { [DEFAULT_HISTORY_STACK_KEY]: ["home"] },
      "",
      "http://localhost/",
    );
    expect(history.pushState).not.toHaveBeenCalled();
  });

  it("popPage calls history.back", () => {
    const history = installHistoryMock(null);
    const persistence = createBrowserHistoryPersistence(config);
    persistence.popPage?.({} as never);
    expect(history.back).toHaveBeenCalled();
  });

  it("resetPageStackToRoot calls history.go with stepsBack", () => {
    const history = installHistoryMock(null);
    const persistence = createBrowserHistoryPersistence(config);
    persistence.resetPageStackToRoot?.({ stepsBack: 2, api: {} as never });
    expect(history.go).toHaveBeenCalledWith(-2);
  });
});
