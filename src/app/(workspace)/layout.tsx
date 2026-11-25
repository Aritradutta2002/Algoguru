import type { ReactNode } from "react";
import { WorkspaceShell } from "@/features/navigation/WorkspaceShell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
