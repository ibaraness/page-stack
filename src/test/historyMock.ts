import { vi } from "vitest";

export function installHistoryMock(initialState: unknown = null) {
  const history = {
    state: initialState,
    pushState: vi.fn((state: unknown) => {
      history.state = state;
    }),
    replaceState: vi.fn((state: unknown) => {
      history.state = state;
    }),
    back: vi.fn(),
    go: vi.fn(),
  };

  vi.stubGlobal("history", history);
  vi.stubGlobal("location", { href: "http://localhost/" });

  return history;
}
