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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("cp-theme") as Theme) || "light";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem("cp-fontsize") as FontSize) || "md";
  });

  const [contentWidth, setContentWidthState] = useState<number>(() => {
    const saved = localStorage.getItem("cp-content-width");
    return saved ? Number(saved) : 1100;
  });

  const setContentWidth = (w: number) => {
    setContentWidthState(w);
    localStorage.setItem("cp-content-width", String(w));
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme); // adds "dark" or "light"
    localStorage.setItem("cp-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_CSS[fontSize];
    localStorage.setItem("cp-fontsize", fontSize);
  }, [fontSize]);

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
    <SettingsContext.Provider value={{ theme, toggleTheme, fontSize, increaseFontSize, decreaseFontSize, contentWidth, setContentWidth }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
