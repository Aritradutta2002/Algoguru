import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type InterfaceDensity = "default" | "compact";

export interface EditorPreferences {
  tabSize: number;
  fontSize: number;
  fontFamily: string;
  wordWrap: "on" | "off";
  minimap: boolean;
  relativeLineNumbers: boolean;
  bracketPairColorization: boolean;
  formatOnType: boolean;
}

const DEFAULT_EDITOR_PREFS: EditorPreferences = {
  tabSize: 2,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  wordWrap: "on",
  minimap: false,
  relativeLineNumbers: false,
  bracketPairColorization: true,
  formatOnType: true,
};

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  contentWidth: number;
  setContentWidth: (w: number) => void;
  density: InterfaceDensity;
  setDensity: (d: InterfaceDensity) => void;
  editorPrefs: EditorPreferences;
  setEditorPrefs: React.Dispatch<React.SetStateAction<EditorPreferences>>;
  updateEditorPref: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void;
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
  const [theme, setThemeState] = useState<Theme>(() => {
    return (
      (localStorage.getItem("algoguru:theme") as Theme) ||
      (localStorage.getItem("cp-theme") as Theme) ||
      "dark"
    );
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (
      (localStorage.getItem("algoguru:fontsize") as FontSize) ||
      (localStorage.getItem("cp-fontsize") as FontSize) ||
      "md"
    );
  });

  const [contentWidth, setContentWidthState] = useState<number>(() => {
    const saved = localStorage.getItem("algoguru:content-width") || localStorage.getItem("cp-content-width");
    return saved ? Number(saved) : 1100;
  });

  const [density, setDensityState] = useState<InterfaceDensity>(() => {
    return (localStorage.getItem("algoguru:density") as InterfaceDensity) || "default";
  });

  const [editorPrefs, setEditorPrefs] = useState<EditorPreferences>(() => {
    try {
      const saved = localStorage.getItem("algoguru:editor-prefs");
      if (saved) return { ...DEFAULT_EDITOR_PREFS, ...JSON.parse(saved) };
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_EDITOR_PREFS;
  });

  const setContentWidth = (w: number) => {
    setContentWidthState(w);
    localStorage.setItem("algoguru:content-width", String(w));
    localStorage.setItem("cp-content-width", String(w));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setFontSize = (f: FontSize) => {
    setFontSizeState(f);
  };

  const setDensity = (d: InterfaceDensity) => {
    setDensityState(d);
    localStorage.setItem("algoguru:density", d);
    if (d === "compact") {
      document.documentElement.classList.add("density-compact");
    } else {
      document.documentElement.classList.remove("density-compact");
    }
  };

  const updateEditorPref = <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
    setEditorPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("algoguru:editor-prefs", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("algoguru:theme", theme);
    localStorage.setItem("cp-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_CSS[fontSize];
    document.documentElement.style.setProperty("--reading-font-size", FONT_SIZE_CSS[fontSize]);
    localStorage.setItem("algoguru:fontsize", fontSize);
    localStorage.setItem("cp-fontsize", fontSize);
  }, [fontSize]);

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  const increaseFontSize = () => {
    setFontSizeState((f) => {
      const idx = FONT_SIZES.indexOf(f);
      return FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
    });
  };

  const decreaseFontSize = () => {
    setFontSizeState((f) => {
      const idx = FONT_SIZES.indexOf(f);
      return FONT_SIZES[Math.max(idx - 1, 0)];
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        contentWidth,
        setContentWidth,
        density,
        setDensity,
        editorPrefs,
        setEditorPrefs,
        updateEditorPref,
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
