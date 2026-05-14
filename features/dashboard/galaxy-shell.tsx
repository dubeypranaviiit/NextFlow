"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Boxes,
  Building2,
  ChevronUp,
  Columns2,
  CreditCard,
  FileText,
  Gift,
  Grid2X2,
  HelpCircle,
  Image,
  Library,
  LogOut,
  MessageSquare,
  Music,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const sections = [
  {
    title: "",
    items: [
      ["All Tools", Grid2X2, "5933"],
      ["Platform", Boxes],
      ["API Docs", BookOpen],
      ["Free Credits", Gift],
      ["Become an Affiliate", CreditCard],
      ["Feature Requests", Library]
    ]
  },
  {
    title: "Unfair Advantage",
    items: [
      ["Prompt Library", BookOpen],
      ["Tutorials", Library],
      ["Ad Library", Library]
    ]
  },
  {
    title: "Generation History",
    items: [
      ["Image Library", Image],
      ["Video Library", Video],
      ["Audio Library", Music]
    ]
  },
  {
    title: "Favorites",
    note: "No favorites yet. Add tools from the tools page.",
    items: [["Saved Prompts", BookOpen]]
  },
  {
    title: "Popular",
    items: [
      ["AI Image Generator", Grid2X2],
      ["AI Video Generator", Grid2X2],
      ["AI Talking Photo", Grid2X2],
      ["AI Lipsync Generator", Grid2X2]
    ]
  }
] as const;

function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function GalaxyShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const countdown = useCountdown(useUiStore((s) => s.countdownSeconds));
  const hidden = compact || !sidebarOpen;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!sidebarOpen) return;
      const sidebar = document.getElementById("galaxy-sidebar");
      if (sidebar && !sidebar.contains(e.target as Node)) {
        if (window.innerWidth < 640) setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sidebarOpen, setSidebarOpen]);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [commandOpen, setCommandOpen]);

  return (
    <div className="min-h-screen bg-white">
   
      <div className="fixed left-0 right-0 top-0 z-40 flex h-[50px] items-center justify-center bg-galaxy-red px-4 text-center text-[12px] font-semibold text-white sm:text-sm">
        Pay once, get a <span className="mx-1 font-extrabold">LIFETIME</span> deal forever — for only $399
        <span className="mx-2 hidden items-center gap-1 text-xs sm:inline-flex">
          ⏱ {countdown}
        </span>
        <span className="ml-2 hidden cursor-pointer rounded-full bg-white px-4 py-1 text-[11px] font-semibold text-galaxy-red sm:inline">
          Click here
        </span>
        <span className="ml-2 inline rounded-full bg-white px-3 py-0.5 text-[10px] font-semibold text-galaxy-red sm:hidden">
          Only $399
        </span>
      </div>

      <aside
        id="galaxy-sidebar"
        className={cn(
          "fixed bottom-0 left-0 top-[50px] z-30 border-r border-gray-200 bg-[#fbfbfc] transition-[width,transform] duration-200",
          hidden ? "w-[213px] -translate-x-full" : "w-[213px] translate-x-0",
          "max-sm:shadow-float"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[50px] items-center justify-between px-3">
            <div className="grid h-6 w-6 place-items-center rounded-full border border-black bg-black text-[10px] text-white">
              NF
            </div>
            <button
              aria-label="Close sidebar"
              className="grid h-7 w-7 place-items-center rounded-md border border-gray-200 text-gray-700 hover:bg-white"
              onClick={() => setSidebarOpen(false)}
            >
              <Columns2 size={14} />
            </button>
          </div>

          {!hidden && (
            <>
              <div className="px-2">
                <button
                  className="flex h-8 w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-500 shadow-card"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search size={13} />
                  <span>Quick search...</span>
                  <span className="ml-auto text-[11px]">⌘K</span>
                </button>
              </div>
              <nav className="galaxy-scrollbar mt-3 flex-1 overflow-y-auto px-2 pb-4">
                {sections.map((section) => (
                  <div key={section.title || "root"} className="mb-5">
                    {section.title && (
                      <div className="mb-2 flex items-center px-1 text-[11px] font-medium text-gray-400">
                        {section.title}
                        <ChevronUp size={12} className="ml-auto" />
                      </div>
                    )}
                    <div className="space-y-1">
                      {section.items.map(([label, Icon, badge]) => (
                        <div
                          key={label}
                          className="flex h-[29px] items-center gap-3 rounded-md px-1.5 text-[13px] text-gray-800 hover:bg-white cursor-pointer"
                        >
                          <Icon size={14} className="text-gray-700" />
                          <span className="truncate">{label}</span>
                          {badge && (
                            <span className="ml-auto rounded-full bg-[#e9e8ff] px-2 py-0.5 text-[11px] font-semibold text-galaxy-purple">
                              {badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {"note" in section && (
                      <p className="mt-3 px-2 text-[11px] leading-4 text-gray-500">
                        {section.note}
                      </p>
                    )}
                  </div>
                ))}
              </nav>
              <div className="border-t border-gray-200 p-2">
                <button
                  className="mb-2 flex h-7 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-[11px]"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings size={13} /> Settings
                </button>
                <button className="mb-3 flex h-8 w-full items-center justify-center gap-2 rounded-full bg-galaxy-purple text-xs font-semibold text-white">
                  <Gift size={13} /> Claim Offer
                </button>
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium">
                  <UserRound
                    size={22}
                    className="rounded-full bg-gray-200 p-1 text-gray-600"
                  />
                  Pranav Abhimanyu
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

     
      {hidden && (
        <button
          aria-label="Open sidebar"
          className="fixed left-[14px] top-[62px] z-40 grid h-8 w-8 place-items-center rounded-md border border-gray-200 bg-white shadow-float hover:bg-gray-50"
          onClick={() => setSidebarOpen(true)}
        >
          <Columns2 size={14} className="text-gray-600" />
        </button>
      )}

  
      <main
        className={cn(
          "min-h-screen pt-[50px] transition-[padding] duration-200",
          hidden ? "pl-0" : "pl-[213px] max-sm:pl-0"
        )}
      >
        {children}
      </main>

    
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}

      {commandOpen && <CommandPalette onClose={() => setCommandOpen(false)} />}
    </div>
  );
}

function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const tabs = [
    ["Account", UserRound],
    ["Billing", CreditCard],
    ["Preferences", SlidersHorizontal],
    ["Resources", HelpCircle]
  ] as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4" onClick={onClose}>
      <section
        className="grid h-[500px] w-full max-w-[746px] grid-cols-[200px_1fr] overflow-hidden rounded-[13px] border border-gray-200 bg-white shadow-float max-sm:h-[calc(100vh-92px)] max-sm:grid-cols-1"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="border-r border-gray-200 bg-[#fbfbfc] p-3 max-sm:hidden">
          <button
            className="mb-5 grid h-8 w-8 place-items-center rounded-md hover:bg-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <div className="space-y-1">
            {tabs.map(([label, Icon], i) => (
              <button
                key={label}
                className={cn(
                  "flex h-[34px] w-full items-center gap-3 rounded-md px-3 text-[13px]",
                  i === 0 ? "bg-white font-medium shadow-card" : "text-gray-600 hover:bg-white"
                )}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </aside>
        <div className="min-w-0">
          <header className="flex h-[50px] items-center border-b border-gray-200 px-5">
            <button
              className="mr-3 grid h-7 w-7 place-items-center rounded-md hover:bg-gray-100 sm:hidden"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-base font-semibold">Account</h2>
          </header>
          <div className="p-5">
            <SectionTitle>Account Information</SectionTitle>
            <InfoRow title="Email" value="dpranav504@gmail.com" />
            <SectionTitle className="mt-5">Organization</SectionTitle>
            <ActionRow
              title="Create Organization"
              description="Start collaborating with your team"
              action="Create"
              icon={<Building2 size={14} />}
              onClick={() => setMessage("Organization creation is ready.")}
            />
            <SectionTitle className="mt-5">Account Actions</SectionTitle>
            <ActionRow
              title="Sign Out"
              description="Sign out of your account"
              action="Sign Out"
              icon={<LogOut size={14} />}
              onClick={() => {
                onClose();
                const clerk = (
                  window as typeof window & {
                    Clerk?: { signOut?: () => Promise<void> };
                  }
                ).Clerk;
                if (clerk?.signOut) {
                  void clerk.signOut().finally(() => {
                    window.location.href = "/sign-in";
                  });
                } else {
                  window.location.href = "/sign-in";
                }
              }}
            />
            <ActionRow
              title="Delete Account"
              description="Permanently delete your account and data"
              action="Delete"
              danger
              icon={<Trash2 size={14} />}
              onClick={() =>
                setMessage(
                  "Delete account requested. Connect Clerk user deletion in production."
                )
              }
            />
            {message && (
              <div className="mt-4 rounded-md border border-gray-200 bg-[#fbfbfc] px-3 py-2 text-[12px] text-gray-600">
                {message}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-gray-500",
        className
      )}
    >
      {children}
    </div>
  );
}

function InfoRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex min-h-[43px] items-center border-b border-gray-200 text-[13px]">
      <span className="font-medium">{title}</span>
      <span className="ml-auto truncate pl-4 text-gray-500">{value}</span>
    </div>
  );
}

function ActionRow({
  title,
  description,
  action,
  icon,
  danger,
  onClick
}: {
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="flex min-h-[56px] items-center border-b border-gray-200 py-2">
      <div>
        <div className={cn("text-[13px] font-medium", danger && "text-red-500")}>
          {title}
        </div>
        <div className="mt-1 text-[11px] text-gray-500">{description}</div>
      </div>
      <button
        className={cn(
          "ml-auto flex h-8 items-center gap-2 rounded-full border px-4 text-[11px]",
          danger ? "border-red-200 text-red-500" : "border-gray-200"
        )}
        onClick={onClick}
      >
        {action} {icon}
      </button>
    </div>
  );
}


function CommandPalette({ onClose }: { onClose: () => void }) {
  const quick = [
    ["Pricing", "Pages", CreditCard, true],
    ["Platform", "Features", Boxes, false],
    ["All Tools", "Pages", Grid2X2, false],
    ["Help Center", "Help", HelpCircle, false]
  ] as const;
  const trending = [
    ["Chat With AI", "Chat", MessageSquare],
    ["AI Image Generator", "Tools", Image],
    ["API Docs", "Docs", FileText]
  ] as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-4" onClick={onClose}>
      <section
        className="w-full max-w-[568px] overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[42px] items-center gap-2 border-b border-gray-200 px-4">
          <Search size={16} className="text-gray-400" />
          <input
            className="min-w-0 flex-1 text-[13px] outline-none placeholder:text-gray-400"
            placeholder="Search models, tools, features, pages, and more..."
            autoFocus
          />
          <span className="rounded bg-gray-100 px-2 py-1 text-[9px] text-gray-400">
            ↑↓ navigate
          </span>
          <button
            className="grid h-6 w-6 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="galaxy-scrollbar max-h-[333px] overflow-y-auto p-3">
          <PaletteLabel>Quick Links</PaletteLabel>
          {quick.map(([title, tag, Icon, active]) => (
            <PaletteItem
              key={title}
              title={title}
              tag={tag}
              icon={<Icon size={19} />}
              active={active}
            />
          ))}
          <PaletteLabel className="mt-4">Trending</PaletteLabel>
          {trending.map(([title, tag, Icon]) => (
            <PaletteItem
              key={title}
              title={title}
              tag={tag}
              icon={<Icon size={19} />}
            />
          ))}
        </div>
        <div className="flex h-[36px] items-center border-t border-gray-100 px-4 text-[10px] text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-1">Enter</span>
          <span className="ml-1">to select</span>
          <span className="ml-3 rounded bg-gray-100 px-2 py-1">Esc</span>
          <span className="ml-1">to close</span>
          <button className="ml-auto text-galaxy-purple">View all tools →</button>
        </div>
      </section>
    </div>
  );
}

function PaletteLabel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-gray-500",
        className
      )}
    >
      <FileText size={13} /> {children}
    </div>
  );
}

function PaletteItem({
  title,
  tag,
  icon,
  active
}: {
  title: string;
  tag: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex h-[49px] w-full items-center gap-3 rounded-lg px-3 text-left",
        active ? "bg-[#f1edff] text-galaxy-purple" : "hover:bg-gray-50"
      )}
    >
      <span className="grid h-[31px] w-[31px] place-items-center rounded-md bg-white text-gray-600 shadow-card">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">
          {title}{" "}
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] uppercase text-gray-500">
            {tag}
          </span>
        </span>
        <span className="mt-1 block truncate text-[11px] text-gray-500">
          Access workflows, tools, and useful pages
        </span>
      </span>
      <span className="ml-auto text-lg">→</span>
    </button>
  );
}
