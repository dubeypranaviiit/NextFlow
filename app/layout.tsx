import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkKeys } from "@/lib/clerk-env";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextFlow",
  description: "LLM workflow builder"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!hasClerkKeys()) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
