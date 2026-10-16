import { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings, type FontSize, type InterfaceDensity } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  PageContainer,
  PageHeader,
  ConfirmDialog,
} from "@/components/layout/PagePrimitives";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  User,
  Sliders,
  Code2,
  Brain,
  Shield,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SettingsSection = "appearance" | "editor" | "learning" | "account";

export default function Settings() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    density,
    setDensity,
    editorPrefs,
    updateEditorPref,
  } = useSettings();

  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Learning preferences stored locally
  const [dailyGoal, setDailyGoal] = useState(() => {
    return localStorage.getItem("algoguru:daily-goal") || "2";
  });
  const [socraticGuru, setSocraticGuru] = useState(() => {
    return localStorage.getItem("algoguru:guru-socratic") === "true";
  });

  const handleDailyGoalChange = (val: string) => {
    setDailyGoal(val);
    localStorage.setItem("algoguru:daily-goal", val);
    toast.success("Daily goal updated");
  };

  const handleSocraticChange = (enabled: boolean) => {
    setSocraticGuru(enabled);
    localStorage.setItem("algoguru:guru-socratic", String(enabled));
    toast.success(enabled ? "Guru Socratic mode enabled" : "Guru Socratic mode disabled");
  };

  const handleClearCache = () => {
    // Clear non-auth localStorage
    const keysToPreserve = ["sb-", "supabase"];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.some((p) => key.startsWith(p))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setResetDialogOpen(false);
    toast.success("Local preferences reset. Reloading page...");
    setTimeout(() => window.location.reload(), 1000);
  };

  const navItems: Array<{ id: SettingsSection; label: string; icon: typeof Sliders }> = [
    { id: "appearance", label: "Appearance", icon: Sliders },
    { id: "editor", label: "Editor Preferences", icon: Code2 },
    { id: "learning", label: "Learning & AI", icon: Brain },
    { id: "account", label: "Account & Data", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your appearance, coding environment, AI assistant behavior, and account."
      />

      <PageContainer className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation rail */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content panel */}
          <div className="md:col-span-3 space-y-8">
            {/* ─── APPEARANCE ───────────────────────────────────── */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-foreground">Theme & Interface</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose how AlgoGuru looks on your screen.
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">
                        Color Theme
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:w-80">
                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-xs font-medium transition-colors",
                            theme === "dark"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Moon size={15} /> Dark mode
                          </span>
                          {theme === "dark" && <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-xs font-medium transition-colors",
                            theme === "light"
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Sun size={15} /> Light mode
                          </span>
                          {theme === "light" && <Check size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-6">
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Interface Density
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Adjust spacing and information density across lists and dashboards.
                      </p>
                      <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-1">
                        <button
                          onClick={() => setDensity("default")}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            density === "default"
                              ? "bg-card text-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Default
                        </button>
                        <button
                          onClick={() => setDensity("compact")}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            density === "compact"
                              ? "bg-card text-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          Compact
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-6">
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Reading Text Size
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Scales reading columns and interview answers without breaking chrome layout.
                      </p>
                      <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-1">
                        {(["sm", "md", "lg", "xl"] as FontSize[]).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-mono font-medium uppercase transition-colors",
                              fontSize === size
                                ? "bg-card text-foreground shadow-xs font-bold"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── EDITOR ───────────────────────────────────────── */}
            {activeSection === "editor" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-foreground">Monaco Code Editor</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Customise the code workspace in Problem Solver, Playground, and Contests.
                  </p>

                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Font Size
                        </label>
                        <select
                          value={editorPrefs.fontSize}
                          onChange={(e) => updateEditorPref("fontSize", Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                        >
                          {[12, 13, 14, 15, 16, 18, 20].map((s) => (
                            <option key={s} value={s}>
                              {s}px
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Tab Size
                        </label>
                        <select
                          value={editorPrefs.tabSize}
                          onChange={(e) => updateEditorPref("tabSize", Number(e.target.value))}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                        >
                          <option value={2}>2 spaces</option>
                          <option value={4}>4 spaces</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Word Wrap</p>
                          <p className="text-[11px] text-muted-foreground">Wrap long lines to fit viewport width.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEditorPref("wordWrap", editorPrefs.wordWrap === "on" ? "off" : "on")}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                            editorPrefs.wordWrap === "on" ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                              editorPrefs.wordWrap === "on" ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Bracket Pair Colorization</p>
                          <p className="text-[11px] text-muted-foreground">Color matching braces and brackets.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEditorPref("bracketPairColorization", !editorPrefs.bracketPairColorization)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                            editorPrefs.bracketPairColorization ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                              editorPrefs.bracketPairColorization ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Code Minimap</p>
                          <p className="text-[11px] text-muted-foreground">Display a miniature code outline on the right edge.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEditorPref("minimap", !editorPrefs.minimap)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                            editorPrefs.minimap ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                              editorPrefs.minimap ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Format on Type</p>
                          <p className="text-[11px] text-muted-foreground">Automatically format line when typing closing braces.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateEditorPref("formatOnType", !editorPrefs.formatOnType)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                            editorPrefs.formatOnType ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                              editorPrefs.formatOnType ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── LEARNING & AI ────────────────────────────────── */}
            {activeSection === "learning" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-foreground">Learning Goals & AI Assistant</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Configure your daily practice targets and Guru AI behavior.
                  </p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Daily Problems Goal
                      </label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Target number of practice problems to solve each day to sustain your streak.
                      </p>
                      <div className="flex gap-2">
                        {["1", "2", "3", "5"].map((count) => (
                          <button
                            key={count}
                            onClick={() => handleDailyGoalChange(count)}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                              dailyGoal === count
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {count} {Number(count) === 1 ? "problem" : "problems"} / day
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">Socratic Guru Mode</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            When enabled, Guru asks guiding questions rather than dumping full solutions immediately.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSocraticChange(!socraticGuru)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                            socraticGuru ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
                              socraticGuru ? "translate-x-4" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ACCOUNT & DATA ───────────────────────────────── */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-semibold text-foreground">Account Information</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Connected account and profile links.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border/60">
                      <div>
                        <p className="text-xs font-medium text-foreground">Signed in as</p>
                        <p className="text-xs text-muted-foreground">{user?.email || "Guest"}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        View Profile <ExternalLink size={12} />
                      </Link>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-border/60">
                      <div>
                        <p className="text-xs font-medium text-foreground">Display Name</p>
                        <p className="text-xs text-muted-foreground">{profile?.display_name || "Not set"}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">
                        Danger Zone
                      </h3>
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Reset Local Application Cache</p>
                          <p className="text-[11px] text-muted-foreground">
                            Clears browser-stored drafts, scratchpad history, and local layout preferences.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResetDialogOpen(true)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors shrink-0"
                        >
                          <Trash2 size={13} /> Clear cache
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset local application data?"
        description="This will clear your local editor drafts, scratchpad buffers, and UI customizations stored in this browser. Your account and progress synced to the cloud will remain safe."
        confirmLabel="Reset local data"
        variant="destructive"
        onConfirm={handleClearCache}
      />
    </div>
  );
}
