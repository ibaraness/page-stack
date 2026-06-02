import { describe, expect, it, afterEach, vi } from "vitest";
import {
  createHistoryStackUtils,
  DEFAULT_HISTORY_STACK_KEY,
} from "./historyStack";
import { installHistoryMock } from "./test/historyMock";

type PageId = "home" | "profile";
const isPageId = (id: string): id is PageId => id === "home" || id === "profile";

describe("createHistoryStackUtils", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses DEFAULT_HISTORY_STACK_KEY by default", () => {
    const utils = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
    });
    expect(utils.stackKey).toBe(DEFAULT_HISTORY_STACK_KEY);
  });

  it("sanitizeStack falls back to initialPageId for invalid input", () => {
    const { sanitizeStack } = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
    });
    expect(sanitizeStack(null)).toEqual(["home"]);
    expect(sanitizeStack(["home", "nope", "profile"])).toEqual(["home", "profile"]);
    expect(sanitizeStack([])).toEqual(["home"]);
  });

  it("mergeHistoryState shallow-merges onto current state", () => {
    installHistoryMock({ appStack: ["home"], modalOpen: true });
    const { mergeHistoryState } = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
    });
    expect(mergeHistoryState({ appStack: ["home", "profile"] })).toEqual({
      appStack: ["home", "profile"],
      modalOpen: true,
    });
  });

  it("readStackFromHistory returns undefined when stack key is missing", () => {
    installHistoryMock({ other: true });
    const { readStackFromHistory } = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
    });
    expect(readStackFromHistory()).toBeUndefined();
  });

  it("readStackFromHistory reads and sanitizes the stack key", () => {
    installHistoryMock({ appStack: ["home", "profile"] });
    const { readStackFromHistory } = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
    });
    expect(readStackFromHistory()).toEqual(["home", "profile"]);
  });

  it("respects custom stackKey", () => {
    installHistoryMock({ myStack: ["home"] });
    const { readStackFromHistory, stackKey } = createHistoryStackUtils({
      initialPageId: "home",
      isValidPageId: isPageId,
      stackKey: "myStack",
    });
    expect(stackKey).toBe("myStack");
    expect(readStackFromHistory()).toEqual(["home"]);
  });
});
