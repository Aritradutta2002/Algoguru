"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  // Deterministic initial state for SSR; hydrate saved mode after mount.
  const [modeId, setModeId] = useState<string>("ds");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ag-mode");
      if (saved && APP_MODES.some((m) => m.id === saved)) {
        setModeId(saved);
      }
    } catch {
      // Ignore storage read failures.
    }
  }, []);

  const setMode = useCallback((id: string) => {
    setModeId(id);
    try {
      localStorage.setItem("ag-mode", id);
    } catch {
      // Ignore storage write failures.
    }
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
