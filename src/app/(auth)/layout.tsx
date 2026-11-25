import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh] bg-obsidian-void text-foreground">{children}</div>;
}
