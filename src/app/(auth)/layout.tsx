import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-obsidian-void text-foreground antialiased selection:bg-primary/20">
      {children}
    </div>
  );
}
