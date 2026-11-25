"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type FontSize = "sm" | "md" | "lg" | "xl";

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  fontSize: FontSize;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  contentWidth: number;
  setContentWidth: (w: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const FONT_SIZES: FontSize[] = ["sm", "md", "lg", "xl"];

const FONT_SIZE_CSS: Record<FontSize, string> = {
  sm: "13px",
  md: "15px",
  lg: "17px",
  xl: "19px",
};

const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem("cp-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Deterministic SSR defaults; real persisted values hydrate after mount.
  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [contentWidth, setContentWidthState] = useState<number>(1100);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTheme(readStoredTheme());

    try {
      const savedFont = localStorage.getItem("cp-fontsize");
      if (savedFont && FONT_SIZES.includes(savedFont as FontSize)) {
        setFontSize(savedFont as FontSize);
      }
      const savedWidth = localStorage.getItem("cp-content-width");
      if (savedWidth) {
        const parsed = Number(savedWidth);
        if (Number.isFinite(parsed)) {
          setContentWidthState(parsed);
        }
      }
    } catch {
      // Ignore storage access failures in private browsing.
    }

    setHydrated(true);
  }, []);

  const setContentWidth = (w: number) => {
    setContentWidthState(w);
    try {
      localStorage.setItem("cp-content-width", String(w));
    } catch {
      // Ignore storage write failures.
    }
  };

  useEffect(() => {
    if (!hydrated) return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem("cp-theme", theme);
    } catch {
      // Ignore storage write failures.
    }

    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (themeColor) {
      themeColor.content = theme === "dark" ? "#070709" : "#FAFAF8";
    }
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.style.fontSize = FONT_SIZE_CSS[fontSize];
    try {
      localStorage.setItem("cp-fontsize", fontSize);
    } catch {
      // Ignore storage write failures.
    }
  }, [fontSize, hydrated]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const increaseFontSize = () => {
    setFontSize((f) => {
      const idx = FONT_SIZES.indexOf(f);
      return FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
    });
  };

  const decreaseFontSize = () => {
    setFontSize((f) => {
      const idx = FONT_SIZES.indexOf(f);
      return FONT_SIZES[Math.max(idx - 1, 0)];
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        toggleTheme,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        contentWidth,
        setContentWidth,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
