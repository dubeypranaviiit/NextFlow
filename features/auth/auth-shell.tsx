"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CreditCard,
  Gift,
  Grid2X2,
  Image,
  KeyRound,
  Library,
  LogIn,
  Search,
  Sparkles,
  Video,
  X,
  Zap
} from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

const navItems = [
  ["Workflows", Grid2X2],
] as const;

export function AuthFlowPage({ mode }: { mode?: AuthMode }) {
  const [modal, setModal] = useState<AuthMode | null>(mode ?? null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <aside className="fixed bottom-0 left-0 top-0 z-20 w-[213px] border-r border-gray-200 bg-[#fbfbfc] max-md:hidden">
        <div className="flex h-full flex-col">
          <div className="flex h-[50px] items-center justify-between px-3">
            <div className="grid h-6 w-6 place-items-center rounded-full border border-black bg-black text-[10px] text-white">NF</div>
            <Grid2X2 size={14} />
          </div>
          <div className="px-2">
            <button className="flex h-8 w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs text-gray-500 shadow-card">
              <Search size={13} />
              Quick search...
              <span className="ml-auto text-[11px]">Ctrl K</span>
            </button>
          </div>
          <nav className="galaxy-scrollbar mt-3 flex-1 overflow-y-auto px-2">
            <div className="space-y-1">
              {navItems.map(([label, Icon]) => (
                <div key={label} className="flex h-[29px] items-center gap-3 rounded-md px-1.5 text-[13px] text-gray-800">
                  <Icon size={14} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </nav>
          <div className="border-t border-gray-200 p-2">
            <button className="flex h-8 w-full items-center justify-center rounded-md bg-white text-xs shadow-card" onClick={() => setModal("sign-in")}>
              Sign in
            </button>
          </div>
        </div>
      </aside>
      <section className="min-h-screen px-4 pb-16 pl-[213px] pt-[45px] max-md:pl-4">
        <div className="mx-auto w-full max-w-[920px]">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-semibold leading-7">Flow</h1>
              <p className="mt-1 text-[13px] text-gray-500">Build workflows or run models directly.</p>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-md bg-black text-white" onClick={() => setModal("sign-in")}>
              <LogIn size={15} />
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-[#f1f1f2] p-10 shadow-card max-sm:p-6">
            <span className="inline-flex h-6 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-[11px] font-semibold">
              <Zap size={12} /> All-in-One AI Platform
            </span>
            <h2 className="mt-4 max-w-[430px] text-[30px] font-bold leading-[1.08] tracking-normal max-sm:text-[26px]">
              Build AI workflows, run models instantly
            </h2>
            <p className="mt-4 max-w-[455px] text-[14px] leading-6 text-gray-600">
              Connect AI models into powerful automated workflows. Text, image, video, audio - all in one place with no code required.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="flex h-9 items-center gap-2 rounded-md bg-black px-4 text-xs font-semibold text-white" onClick={() => setModal("sign-in")}>
                <LogIn size={14} /> Sign in to get started
              </button>
              <button className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-xs font-semibold" onClick={() => setModal("sign-up")}>
                Create free account <ArrowRight size={13} />
              </button>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 max-lg:grid-cols-1">
            <InfoCard icon={<Boxes size={16} />} title="Visual Workflow Builder" text="Drag-and-drop canvas to chain AI models together. No coding needed." />
            <InfoCard icon={<Video size={16} />} title="Run Models Directly" text="Access 100+ AI models for text, image, video, and audio." />
            <InfoCard icon={<KeyRound size={16} />} title="API Access" text="Run any workflow via API. Manage keys and rate limits." />
          </div>
        </div>
      </section>
      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} onSwitch={setModal} onLoadingChange={setLoading} />}
      {loading && <LoadingScreen overlay />}
    </main>
  );
}

function Section({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="mt-5">
      <div className="mb-2 px-1 text-[11px] font-medium text-gray-400">{title}</div>
      {items.map((item) => (
        <div key={item} className="flex h-[29px] items-center gap-3 rounded-md px-1.5 text-[13px] text-gray-800">
          <Grid2X2 size={14} />
          <span className="truncate">{item}</span>
        </div>
      ))}
    </div>
  );
}

function InfoCard({ icon, title, text, compact }: { icon: React.ReactNode; title: string; text: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-4 shadow-card", compact ? "min-h-[78px]" : "min-h-[126px]")}>
      <div className="grid h-8 w-8 place-items-center rounded-md bg-gray-100">{icon}</div>
      <div className="mt-3 text-[13px] font-semibold">{title}</div>
      <p className="mt-1 text-[11px] leading-5 text-gray-500">{text}</p>
    </div>
  );
}

import { SignIn, SignUp } from "@clerk/nextjs";

function AuthModal({ mode, onClose }: { mode: AuthMode; onClose: () => void; onSwitch: (mode: AuthMode) => void; onLoadingChange: (loading: boolean) => void }) {
  const isSignIn = mode === "sign-in";

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto bg-black/70 px-4 pt-[54px]">
      <div className="relative mt-4">
        <button 
          className="absolute -right-10 top-0 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white max-sm:right-0 max-sm:-top-10" 
          onClick={onClose} 
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {isSignIn ? (
          <SignIn routing="hash" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
        ) : (
          <SignUp routing="hash" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard" />
        )}
      </div>
    </div>
  );
}
