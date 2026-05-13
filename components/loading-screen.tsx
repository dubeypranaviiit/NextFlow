"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const messages = [
  "Live like it's heaven on earth 🌏",
  "They create addiction. We create empowerment 💊",
  "The future is what you build today 🚀",
  "Dream big. Ship fast. Iterate always ✨",
  "Make something people want 🎯",
];

export function LoadingScreen({ overlay = false, className }: { overlay?: boolean; className?: string }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "grid min-h-screen place-items-center bg-white",
        overlay && "fixed inset-0 z-[80]",
        className
      )}
    >
      {/* Radial gradient background matching Galaxy.ai */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,190,237,0.36)_0,rgba(224,226,255,0.34)_13%,rgba(255,255,255,0.78)_28%,#ffffff_58%)]" />

      <div className="relative flex flex-col items-center text-center">
        {/* Concentric ring spinner – matches Galaxy.ai loading screen exactly */}
        <div className="galaxy-loader mb-7">
          <span />
          <span />
          <span />
          <span />
          <i />
        </div>

        {/* Rotating message */}
        <p className="max-w-[285px] text-[17px] font-semibold leading-[22px] text-[#35313a]">
          {messages[msgIdx]}
        </p>

        {/* Three pulsing dots */}
        <div className="mt-6 flex gap-1.5">
          <span className="loading-dot" />
          <span className="loading-dot [animation-delay:160ms]" />
          <span className="loading-dot [animation-delay:320ms]" />
        </div>
      </div>

      {/* Footer branding */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[12px] text-gray-500">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 text-[8px] font-bold text-white">
          M
        </span>
        Magica • The #1 All-in-One AI Platform
      </div>
    </div>
  );
}
