import type { ReactNode } from "react";
import "@/styles/auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ag-theme ag-auth">
      {children}
    </div>
  );
}
