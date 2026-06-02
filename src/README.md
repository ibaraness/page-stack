# Page stack (portable)

Self-contained React navigation: in-memory stack, optional browser `history` sync, optional slide outlet.

**Copy this entire `pageStack` folder** into another project (no monorepo required). All imports inside the folder are relative only.

## Peer dependencies

Install in the host project:

| Package | Required for |
|---------|----------------|
| `react`, `react-dom` | Providers, hooks, outlet |
| `motion` | `PageStackOutlet` slide animations only |

If you skip `PageStackOutlet`, you only need React and can render `pages[currentPageId]` yourself.

## Folder layout

```text
pageStack/
  index.ts              ← public API
  types.ts
  usePageStackEngine.ts ← headless stack (no history)
  PageStackContext.tsx  ← providers
  PageStackOutlet.tsx
  slideTransition.ts
  historyStack.ts
  browser/
    createBrowserHistoryPersistence.ts
    mergePageStackPersistence.ts
```

## Setup in a new project

1. Copy `pageStack/` (e.g. next to `src/lib/pageStack` or `src/navigation/pageStack`).
2. Import from the folder path:

```tsx
import {
  InMemoryPageStackProvider,
  PageStackOutlet,
} from "@/lib/pageStack"; // adjust alias to your copy location
```

3. Ensure client components: files with hooks are marked `"use client"`.

4. Implement **host persistence** for app-specific state (reducers, API, extra `history.state` keys) via `PageStackPersistence` — see Get Out Of It’s `appPageStack/` in the original repo for a full example.

## Modes

### In-memory (slider, wizard)

No `window.history`. `popPage` shrinks the React stack only — the browser URL never changes.

#### Mental model

1. **Page ids** — a string union you define (e.g. `"intro" | "step1" | "step2"`).
2. **`pages` map** — a static registry: `Record<PageId, ReactComponent>`. You do not “add pages” at runtime; you register every screen up front, then **push ids** onto the stack.
3. **Stack** — an array of ids starting with `initialPageId`. The **active screen** is always the last id (`currentPageId`).
4. **Navigation** — call `pushPage(id)` / `popPage()` from any descendant via `usePageStackCore()`.

#### Step-by-step

**1. Define ids and a type guard**

```tsx
type WizardPageId = "intro" | "details" | "done";

const WIZARD_PAGES: WizardPageId[] = ["intro", "details", "done"];

function isWizardPageId(id: string): id is WizardPageId {
  return (WIZARD_PAGES as string[]).includes(id);
}
```

**2. Build screen components that navigate**

Screens must live **inside** the provider. Import `usePageStackCore` (not browser history).

```tsx
"use client";

import {
  InMemoryPageStackProvider,
  PageStackOutlet,
  usePageStackCore,
} from "@/lib/pageStack";

function IntroScreen() {
  const { pushPage } = usePageStackCore<WizardPageId>();
  return (
    <button type="button" onClick={() => pushPage("details")}>
      Next
    </button>
  );
}

function DetailsScreen() {
  const { pushPage, popPage, canGoBack } = usePageStackCore<WizardPageId>();
  return (
    <>
      {canGoBack ? (
        <button type="button" onClick={() => popPage()}>
          Back
        </button>
      ) : null}
      <button type="button" onClick={() => pushPage("done")}>
        Finish
      </button>
    </>
  );
}

function DoneScreen() {
  const { resetPageStackToRoot } = usePageStackCore<WizardPageId>();
  return (
    <button type="button" onClick={() => resetPageStackToRoot()}>
      Start over
    </button>
  );
}
```

**3. Register every id in `pages` and wrap with the provider**

The map must include **`initialPageId`** and every id you might `pushPage`.

```tsx
const pages = {
  intro: IntroScreen,
  details: DetailsScreen,
  done: DoneScreen,
} satisfies Record<WizardPageId, React.ComponentType>;

export function Wizard() {
  return (
    <InMemoryPageStackProvider
      config={{ initialPageId: "intro", isValidPageId: isWizardPageId }}
      onCurrentPageChange={(id) => console.log("active:", id)}
    >
      <PageStackOutlet pages={pages} />
    </InMemoryPageStackProvider>
  );
}
```

On mount, the stack is `["intro"]` and `IntroScreen` renders. `pushPage("details")` → `["intro", "details"]` with a forward slide. `popPage()` → back to `["intro"]` with a backward slide.

#### Navigation API (`usePageStackCore`)

| Member | In-memory behavior |
|--------|-------------------|
| `currentPageId` | Last id on the stack (active screen). |
| `pageStack` | Full stack, e.g. `["intro", "details"]`. |
| `canGoBack` | `pageStack.length > 1`. |
| `pushPage(id)` | Append `id` if `isValidPageId(id)`. Ignored for invalid ids. |
| `popPage()` | Remove last id. No-op on root. Does **not** call `history.back()`. |
| `replacePageStack(stack)` | Replace stack; first entry must be `initialPageId`; all ids must be valid. |
| `resetPageStackToRoot()` | Collapse to `[initialPageId]` in one step (backward animation). |
| `navigationDirection` | `1` forward, `-1` back — drives `PageStackOutlet` slides. |
| `stackKey` | `pageStack.join("/")` — outlet animation key. |

Optional: `usePageStackCoreOptional()` returns `null` outside a provider (same pattern as the host app’s `usePageStackOptional`).

#### Without `PageStackOutlet` (no `motion` peer dep)

Render the active screen yourself:

```tsx
function ManualOutlet({ pages }: { pages: Record<WizardPageId, React.ComponentType> }) {
  const { currentPageId } = usePageStackCore<WizardPageId>();
  const Screen = pages[currentPageId];
  return Screen ? <Screen /> : null;
}
```

#### Image slider pattern

Use numeric string ids and push/pop instead of mutating index state:

```tsx
<InMemoryPageStackProvider config={{ initialPageId: "0", isValidPageId: isSlideId }}>
  <PageStackOutlet pages={slides} />
  <SliderControls /> {/* calls pushPage(String(n+1)) / popPage() */}
</InMemoryPageStackProvider>
```

#### Minimal end-to-end example

```tsx
"use client";

import {
  InMemoryPageStackProvider,
  PageStackOutlet,
  usePageStackCore,
} from "./pageStack";

type Id = "a" | "b";
const isId = (s: string): s is Id => s === "a" || s === "b";

function ScreenA() {
  const { pushPage } = usePageStackCore<Id>();
  return <button onClick={() => pushPage("b")}>Go to B</button>;
}
function ScreenB() {
  const { popPage } = usePageStackCore<Id>();
  return <button onClick={() => popPage()}>Back to A</button>;
}

export default function Playground() {
  return (
    <InMemoryPageStackProvider config={{ initialPageId: "a", isValidPageId: isId }}>
      <PageStackOutlet pages={{ a: ScreenA, b: ScreenB }} />
    </InMemoryPageStackProvider>
  );
}
```

### Browser + stack on `history.state`

```tsx
import {
  BrowserHistoryPageStackProvider,
  createBrowserHistoryPersistence,
  PageStackOutlet,
} from "./pageStack";

const config = { initialPageId: "home", isValidPageId: isHomePage };

<BrowserHistoryPageStackProvider
  config={config}
  persistence={createBrowserHistoryPersistence(config)}
>
  <PageStackOutlet pages={pages} />
</BrowserHistoryPageStackProvider>
```

### Host app with extra state

Implement `PageStackPersistence` (`initialize`, `commitStackChange`, `handlePopState`, …) or compose:

```ts
mergePageStackPersistence(
  createBrowserHistoryPersistence(config),
  myAppPersistence,
);
```

## What stays outside this folder

Anything app-specific: screen registry, global store, session traces, auth, API. The host project wires those through `PageStackPersistence`, not by editing files inside `pageStack/`.
