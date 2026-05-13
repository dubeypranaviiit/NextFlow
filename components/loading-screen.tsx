import { cn } from "@/lib/utils";

export function LoadingScreen({ overlay = false, className }: { overlay?: boolean; className?: string }) {
  return (
    <div className={cn("grid min-h-screen place-items-center bg-white", overlay && "fixed inset-0 z-[80]", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,190,237,0.36)_0,rgba(224,226,255,0.34)_13%,rgba(255,255,255,0.78)_28%,#ffffff_58%)]" />
      <div className="relative flex flex-col items-center text-center">
        <div className="galaxy-loader mb-7">
          <span />
          <span />
          <span />
          <span />
          <i />
        </div>
        <p className="max-w-[285px] text-[17px] font-semibold leading-[22px] text-[#35313a]">
          They create addiction. We create
          <br />
          empowerment <span className="text-[16px]">💊</span>
        </p>
        <div className="mt-6 flex gap-1.5">
          <span className="loading-dot" />
          <span className="loading-dot [animation-delay:160ms]" />
          <span className="loading-dot [animation-delay:320ms]" />
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[12px] text-gray-500">
        Magica • The #1 All-in-One AI Platform
      </div>
    </div>
  );
}
