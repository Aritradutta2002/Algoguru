import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AppMode {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const APP_MODES: AppMode[] = [
  { id: "ds", label: "Data Structures", icon: "⊞", description: "DSA & Competitive Programming" },
  { id: "lang", label: "Core Java", icon: "☕", description: "Java Language A to Z" },
  { id: "practice", label: "Practice Problems", icon: "🏆", description: "Curated Practice Problems" },
];

interface ModeContextType {
  currentMode: AppMode;
  setMode: (modeId: string) => void;
  modes: AppMode[];
}

const ModeContext = createContext<ModeContextType | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [modeId, setModeId] = useState<string>(() => {
    return localStorage.getItem("ag-mode") || "ds";
  });

  const setMode = useCallback((id: string) => {
    setModeId(id);
    localStorage.setItem("ag-mode", id);
  }, []);

  const currentMode = APP_MODES.find((m) => m.id === modeId) || APP_MODES[0];

  return (
    <ModeContext.Provider value={{ currentMode, setMode, modes: APP_MODES }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
