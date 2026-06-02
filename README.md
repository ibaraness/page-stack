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

> For browser-history mode, persistence composition, and advanced patterns,
> see the in-depth guide in [`src/README.md`](./src/README.md).

## Local development

npm workspace: the package is at the root, a Vite playground lives in `playground/`.

```bash
npm install          # install root + playground deps
npm run playground   # start the Vite playground (aliased to ./src for HMR)
npm run build        # build the library → dist/ (ESM + CJS + .d.ts + page-stack.css)
npm run typecheck    # type-check the library
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
│   └── index.css        # Tailwind entry → built to dist/page-stack.css
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
