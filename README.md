# @ibaraness/page-stack

A lightweight React **navigation stack** — push/pop string page ids with animated slide transitions. Works fully in-memory (sliders, wizards, previews) or synced to the browser `history` API. Built with TypeScript; slide animations use [`motion`](https://motion.dev), styling uses Tailwind CSS.

```tsx
import {
  InMemoryPageStackProvider,
  PageStackOutlet,
  usePageStackCore,
} from "@ibaraness/page-stack";
```

## Features

- 📚 Imperative `pushPage` / `popPage` / `replacePageStack` / `resetPageStackToRoot`
- 🧠 Headless engine (`usePageStackEngine`) — bring your own renderer, or use `PageStackOutlet`
- 🌐 Optional browser `history.state` sync via `createBrowserHistoryPersistence`
- 🎬 Forward/back slide transitions out of the box
- 🔠 Fully typed, generic over your page-id union

## Installation

```bash
npm install @ibaraness/page-stack
```

Peer dependencies:

| Package              | Required for                               |
| -------------------- | ------------------------------------------ |
| `react`, `react-dom` | Providers, hooks (`>= 18`)                 |
| `motion`             | `PageStackOutlet` slide animations only \* |

> \* `motion` (`^12.38.0`) is an **optional** peer dependency. If you render the
> active page yourself instead of using `PageStackOutlet`, you don't need it.

## Styling with Tailwind

`PageStackOutlet` uses a few Tailwind utility classes. Either:

- **You use Tailwind** — scan this package in your CSS (Tailwind v4):

```css
@import "tailwindcss";
@source "../node_modules/@ibaraness/page-stack/dist";
```

- **You don't use Tailwind** — import the prebuilt stylesheet once:

```ts
import "@ibaraness/page-stack/styles.css";
```

## Quick start (in-memory wizard / slider)

```tsx
"use client";

import {
  InMemoryPageStackProvider,
  PageStackOutlet,
  usePageStackCore,
} from "@ibaraness/page-stack";

type PageId = "intro" | "details" | "done";
const isPageId = (id: string): id is PageId =>
  id === "intro" || id === "details" || id === "done";

function Intro() {
  const { pushPage } = usePageStackCore<PageId>();
  return <button onClick={() => pushPage("details")}>Next</button>;
}

function Details() {
  const { pushPage, popPage, canGoBack } = usePageStackCore<PageId>();
  return (
    <>
      {canGoBack && <button onClick={() => popPage()}>Back</button>}
      <button onClick={() => pushPage("done")}>Finish</button>
    </>
  );
}

function Done() {
  const { resetPageStackToRoot } = usePageStackCore<PageId>();
  return <button onClick={() => resetPageStackToRoot()}>Start over</button>;
}

const pages = {
  intro: Intro,
  details: Details,
  done: Done,
} satisfies Record<PageId, React.ComponentType>;

export function Wizard() {
  return (
    <InMemoryPageStackProvider
      config={{ initialPageId: "intro", isValidPageId: isPageId }}
    >
      <PageStackOutlet pages={pages} />
    </InMemoryPageStackProvider>
  );
}
```

## Browser history mode

Use this when the stack should survive **refresh**, **deep links**, and the device **back button** — for example a mobile-style app shell where each screen is a `history` entry.

### In-memory vs browser

| | `InMemoryPageStackProvider` | `BrowserHistoryPageStackProvider` |
| --- | --- | --- |
| URL / `history` | Unchanged | `pushState` / `replaceState` on each stack change |
| `popPage()` | Shrinks React state only | Calls `history.back()`; stack syncs in `popstate` |
| `resetPageStackToRoot()` | Collapses stack in memory | `history.go(-stepsBack)` when stack depth is greater than 1 |
| Back button | No effect on stack | Restores stack from `history.state` |

The navigation hooks (`usePageStackCore`) are the same in both modes — only the provider and persistence layer differ.

### Quick start (browser + `createBrowserHistoryPersistence`)

`createBrowserHistoryPersistence` is the built-in adapter: it reads and writes the page id array on `window.history.state`. Pair it with `BrowserHistoryPageStackProvider`.

```tsx
"use client";

import {
  BrowserHistoryPageStackProvider,
  createBrowserHistoryPersistence,
  PageStackOutlet,
  usePageStackCore,
} from "@ibaraness/page-stack";

type PageId = "home" | "profile" | "settings";

const PAGE_IDS: PageId[] = ["home", "profile", "settings"];
const isPageId = (id: string): id is PageId =>
  (PAGE_IDS as string[]).includes(id);

const config = { initialPageId: "home" as const, isValidPageId: isPageId };

function Home() {
  const { pushPage } = usePageStackCore<PageId>();
  return <button onClick={() => pushPage("profile")}>Profile</button>;
}

function Profile() {
  const { pushPage, popPage, canGoBack } = usePageStackCore<PageId>();
  return (
    <>
      {canGoBack && <button onClick={() => popPage()}>Back</button>}
      <button onClick={() => pushPage("settings")}>Settings</button>
    </>
  );
}

function Settings() {
  const { resetPageStackToRoot } = usePageStackCore<PageId>();
  return <button onClick={() => resetPageStackToRoot()}>Home</button>;
}

const pages = {
  home: Home,
  profile: Profile,
  settings: Settings,
} satisfies Record<PageId, React.ComponentType>;

export function AppShell() {
  return (
    <BrowserHistoryPageStackProvider
      config={config}
      persistence={createBrowserHistoryPersistence(config)}
    >
      <PageStackOutlet pages={pages} />
    </BrowserHistoryPageStackProvider>
  );
}
```

On first mount, persistence either **hydrates** from existing `history.state` or seeds the stack with `[initialPageId]` via `replaceState`. Each `pushPage` appends an id and calls `pushState`; `popPage` delegates to `history.back()` and updates React state when `popstate` fires.

### What `createBrowserHistoryPersistence` does

Pass the same `PageStackConfig` you use on the provider (plus an optional `stackKey`):

```ts
createBrowserHistoryPersistence({
  initialPageId: "home",
  isValidPageId: isPageId,
  stackKey: "appStack", // optional; default is DEFAULT_HISTORY_STACK_KEY ("appStack")
});
```

| Persistence hook | Role |
| --- | --- |
| `initialize` | Read stack from `history.state[stackKey]`, or write `[initialPageId]` if missing |
| `commitStackChange` | `push` / `replace` → `pushState`; `reset-replace` → `replaceState` |
| `popPage` | `window.history.back()` (engine does not pop in memory first) |
| `resetPageStackToRoot` | `window.history.go(-stepsBack)` when collapsing a deep stack |
| `handlePopState` | Sanitize stack from `event.state`, set slide direction, sync React state |

The stack is stored as a **string array** on `history.state`, e.g. `{ appStack: ["home", "profile"] }`. Unrelated keys on `history.state` are preserved via shallow merge when writing.

Re-exported constant: `DEFAULT_HISTORY_STACK_KEY` (`"appStack"`). Override `stackKey` if another library already uses that property name.

### `BrowserHistoryPageStackProvider` props

```tsx
<BrowserHistoryPageStackProvider
  config={{ initialPageId, isValidPageId }}
  persistence={createBrowserHistoryPersistence(config)}
>
  {children}
</BrowserHistoryPageStackProvider>
```

- **`config`** — `initialPageId` and `isValidPageId` (same as in-memory mode).
- **`persistence`** — any `PageStackPersistence` implementation. Use `createBrowserHistoryPersistence` for stack-only sync; implement custom persistence when you also need reducers, session traces, or extra `history.state` fields.

Convenience alias: **`PageStackProvider`** accepts a single `integration` object that merges `config` + persistence methods (`PageStackIntegration`). Prefer `BrowserHistoryPageStackProvider` when config and persistence are defined separately.

### Composing persistence (`mergePageStackPersistence`)

When the host app must persist **more than the page stack** (global store, flow snapshots, analytics), implement `PageStackPersistence` in your app and layer it on top of the browser adapter:

```ts
import {
  createBrowserHistoryPersistence,
  mergePageStackPersistence,
} from "@ibaraness/page-stack";

const config = { initialPageId: "home" as const, isValidPageId: isPageId };

const persistence = mergePageStackPersistence(
  createBrowserHistoryPersistence(config),
  {
    commitStackChange(ctx) {
      // e.g. sync Redux, save session trace — runs after base writes history
    },
    onCurrentPageChange(pageId) {
      // analytics, document title, etc.
    },
  },
);

// <BrowserHistoryPageStackProvider config={config} persistence={persistence} />
```

`mergePageStackPersistence(base, overlay)` calls **both** layers for `initialize`, `commitStackChange`, and `handlePopState`. For `popPage` and `resetPageStackToRoot`, the **overlay wins** if it defines those methods; otherwise the base (browser) behavior runs.

### Custom persistence with `createHistoryStackUtils`

If you cannot use `createBrowserHistoryPersistence` as-is, use the lower-level helpers (same stack key semantics):

```ts
import { createHistoryStackUtils, DEFAULT_HISTORY_STACK_KEY } from "@ibaraness/page-stack";

const { stackKey, sanitizeStack, readStackFromHistory, mergeHistoryState } =
  createHistoryStackUtils({ initialPageId: "home", isValidPageId: isPageId });
```

Wire those inside your own `PageStackPersistence` (`initialize`, `commitStackChange`, `handlePopState`). See [`src/README.md`](./src/README.md) for the portable folder copy guide and host-app patterns.

### Browser mode: `usePageStackCore` behavior

| Member | Browser behavior |
| --- | --- |
| `pushPage(id)` | Appends id, `pushState` with updated stack |
| `popPage()` | `history.back()` — stack updates on `popstate` |
| `replacePageStack(stack)` | Replaces stack; uses `pushState` (new history entry) |
| `resetPageStackToRoot()` | `history.go(-n)` when `n > 0`, else in-memory collapse |
| `navigationDirection` | Set from stack depth change on `popstate` |

Invalid page ids passed to `pushPage` are still ignored (same as in-memory). The first entry of any stack must remain `initialPageId` after sanitization.

## Public API

**Providers**

- `InMemoryPageStackProvider` — headless stack, no URL changes (sliders, wizards).
- `BrowserHistoryPageStackProvider` — stack synced to `history.state` via a `persistence` object.
- `PageStackProvider` — browser provider that takes a single `PageStackIntegration` (config + persistence).

**Hooks**

- `usePageStackCore<TPageId>()` — navigation controller (throws outside a provider).
- `usePageStackCoreOptional<TPageId>()` — returns `null` outside a provider.
- `usePageStackEngine` — the underlying headless state engine.

**Rendering & transitions**

- `PageStackOutlet` — renders `pages[currentPageId]` with slide transitions (needs `motion`).
- `slideTransition`, `slideVariants` — the default `motion` variants (override as needed).

**Browser persistence**

- `createBrowserHistoryPersistence`, `mergePageStackPersistence`
- `createHistoryStackUtils`, `DEFAULT_HISTORY_STACK_KEY`

**`usePageStackCore` controller**

| Member                      | Behavior                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| `currentPageId`             | Active screen (last id on the stack).                                 |
| `pageStack`                 | Full stack, e.g. `["intro", "details"]`.                              |
| `canGoBack`                 | `pageStack.length > 1`.                                               |
| `pushPage(id, meta?)`       | Append `id` if `isValidPageId(id)`; ignored otherwise.                |
| `popPage()`                 | Remove the last id (no-op at root). In browser mode, calls back.      |
| `replacePageStack(stack)`   | Replace the stack; first entry must be `initialPageId`.               |
| `resetPageStackToRoot()`    | Collapse to `[initialPageId]` (backward animation).                   |
| `navigationDirection`       | `1` forward, `-1` back — drives `PageStackOutlet` slides.             |
| `stackKey`                  | `pageStack.join("/")` — outlet animation key.                         |

**Types**

```ts
import type {
  Direction,
  PageStackConfig,
  PageStackContextValue,
  PageStackIntegration,
  PageStackPersistence,
  PageStackChangeContext,
  PageStackChangeKind,
  PageStackProviderProps,
  InMemoryPageStackProviderProps,
  BrowserHistoryPageStackProviderProps,
} from "@ibaraness/page-stack";
```

For copying the source tree into another repo (relative imports, folder layout), see [`src/README.md`](./src/README.md).

## Local development

npm workspace: the package is at the root, a Vite playground lives in `playground/`.

```bash
npm install          # install root + playground deps
npm run playground   # start the Vite playground (aliased to ./src for HMR)
npm run build        # build the library → dist/ (ESM + CJS + .d.ts + styles.css)
npm run typecheck    # type-check the library
npm test             # run unit tests (Vitest)
npm run test:watch   # run tests in watch mode
```

### Structure

```
.
├── src/                 # library source (your real implementation)
│   ├── index.ts         # public entry / exports
│   ├── PageStackContext.tsx
│   ├── PageStackOutlet.tsx
│   ├── usePageStackEngine.ts
│   ├── historyStack.ts
│   ├── slideTransition.ts
│   ├── browser/
│   ├── types.ts
│   └── index.css        # Tailwind entry → built to dist/styles.css
├── playground/          # Vite + Tailwind demo app
├── tsup.config.ts       # library build config (ESM + CJS + d.ts)
└── package.json
```

## Publishing

```bash
npm run build
npm publish --access public
```

## License

MIT © Idan Baraness
