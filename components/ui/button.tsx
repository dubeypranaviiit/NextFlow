import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "secondary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border text-xs font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-galaxy-purple bg-galaxy-purple text-white shadow-sm hover:bg-[#5544ec]",
        variant === "secondary" && "border-gray-200 bg-white text-gray-900 shadow-card hover:bg-gray-50",
        variant === "ghost" && "border-transparent bg-transparent text-gray-700 hover:bg-gray-100",
        variant === "dark" && "border-[#111114] bg-[#111114] text-white hover:bg-black",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-9 px-4",
        size === "icon" && "h-8 w-8 p-0",
        className
      )}
      {...props}
    />
  );
}
