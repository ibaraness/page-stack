import {
  BrowserHistoryPageStackProvider,
  createBrowserHistoryPersistence,
  PageStackOutlet,
  usePageStackCore,
} from "@ibaraness/page-stack";

type PageId = "home" | "profile" | "notifications" | "settings";

const PAGE_IDS: PageId[] = ["home", "profile", "notifications", "settings"];
const isPageId = (id: string): id is PageId =>
  (PAGE_IDS as string[]).includes(id);

function Header({ title }: { title: string }) {
  const { popPage, canGoBack } = usePageStackCore<PageId>();
  return (
    <header className="sticky top-0 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
      {canGoBack && (
        <button
          onClick={() => popPage()}
          className="rounded-full px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          ← Back
        </button>
      )}
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
    </header>
  );
}

function NavButton({ to, children }: { to: PageId; children: React.ReactNode }) {
  const { pushPage } = usePageStackCore<PageId>();
  return (
    <button
      onClick={() => pushPage(to)}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 shadow-sm transition hover:border-indigo-300 hover:shadow"
    >
      <span>{children}</span>
      <span className="text-slate-400">›</span>
    </button>
  );
}

function HomeScreen() {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Header title="Home" />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-slate-500">
          Tap a row to push a new page onto the stack.
        </p>
        <NavButton to="profile">Profile</NavButton>
        <NavButton to="notifications">Notifications</NavButton>
        <NavButton to="settings">Settings</NavButton>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Header title="Profile" />
      <div className="p-4 text-sm text-slate-500">
        Your profile page. Hit “Back” to slide out.
      </div>
    </div>
  );
}

function NotificationsScreen() {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Header title="Notifications" />
      <div className="p-4 text-sm text-slate-500">No new notifications.</div>
    </div>
  );
}

function SettingsScreen() {
  const { resetPageStackToRoot } = usePageStackCore<PageId>();
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Header title="Settings" />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-slate-500">
          Use <code className="rounded bg-slate-200 px-1">resetPageStackToRoot()</code>{" "}
          to slide all the way back home.
        </p>
        <button
          onClick={() => resetPageStackToRoot()}
          className="rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700"
        >
          Reset to Home
        </button>
      </div>
    </div>
  );
}

const pages = {
  home: HomeScreen,
  profile: ProfileScreen,
  notifications: NotificationsScreen,
  settings: SettingsScreen,
} satisfies Record<PageId, React.ComponentType>;

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 to-slate-300 p-6">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-700">
          @ibaraness/page-stack
        </h2>
        <div className="flex h-[640px] w-[360px] flex-col overflow-hidden rounded-[2.5rem] border-8 border-slate-900 bg-white shadow-2xl">
          <BrowserHistoryPageStackProvider
            config={{ initialPageId: "home", isValidPageId: isPageId }}
            persistence={createBrowserHistoryPersistence({ initialPageId: "home", isValidPageId: isPageId })}
          >
            <PageStackOutlet pages={pages} />
          </BrowserHistoryPageStackProvider>
        </div>
      </div>
    </div>
  );
}
