import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-xs outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100 disabled:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[58px] w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-xs leading-5 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100 disabled:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
