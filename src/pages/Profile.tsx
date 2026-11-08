import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Camera,
  Save,
  Loader2,
  Github,
  Linkedin,
  Globe,
  Briefcase,
  Edit2,
  Share2,
  GraduationCap,
  ChevronDown,
  RefreshCw,
  CalendarDays,
  Mail,
  ExternalLink,
  Twitter,
  Target,
  Trophy,
  Check,
  Link2,
  Flame,
  Code2,
  LayoutGrid,
} from "lucide-react";
import {
  ActivityHeatmap,
  MODE_INTENSITY_COLORS,
  type HeatmapRange,
} from "@/components/ActivityHeatmap";
import { cn } from "@/lib/utils";
import { practiceData } from "@/data/practiceData";
import {
  fetchLeetcodeUserStats,
  LeetcodeUserNotFoundError,
} from "@/lib/leetcodeUserStats";

// Build a lookup of problem_id -> difficulty from the static practice sheet.
const PROBLEM_DIFFICULTY_MAP: Record<string, "Easy" | "Medium" | "Hard"> =
  (() => {
    const map: Record<string, "Easy" | "Medium" | "Hard"> = {};
    practiceData.forEach((topic) => {
      topic.subtopics.forEach((sub) => {
        sub.problems.forEach((prob) => {
          map[prob.id] = prob.difficulty;
        });
      });
    });
    return map;
  })();

const TOTAL_WEBSITE_EASY = Object.values(PROBLEM_DIFFICULTY_MAP).filter((d) => d === "Easy").length;
const TOTAL_WEBSITE_MEDIUM = Object.values(PROBLEM_DIFFICULTY_MAP).filter((d) => d === "Medium").length;
const TOTAL_WEBSITE_HARD = Object.values(PROBLEM_DIFFICULTY_MAP).filter((d) => d === "Hard").length;
const TOTAL_WEBSITE_QUESTIONS = TOTAL_WEBSITE_EASY + TOTAL_WEBSITE_MEDIUM + TOTAL_WEBSITE_HARD;

const BIO_MAX_LENGTH = 320;

const EMPTY_CALENDAR: Record<string, number> = {};

type ConsistencyMode = "all" | "website" | "leetcode" | "codechef";
type DsaMode = "website" | "leetcode" | "codechef";

// Normalize any calendar key (YYYY-MM-DD, unix seconds, or parseable date)
// to a YYYY-MM-DD day string so platform calendars can be merged.
const normalizeDayKey = (value: string): string | null => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const timestamp = Number(value);
  if (Number.isFinite(timestamp)) {
    const date = new Date(timestamp * 1000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

// Active days / longest streak / best day, derived from a single calendar.
const computeHighlights = (source: Record<string, number>) => {
  const active = new Map<string, number>();
  Object.entries(source).forEach(([key, count]) => {
    const normalized = normalizeDayKey(key);
    const value = Number(count) || 0;
    if (normalized && value > 0) {
      active.set(normalized, (active.get(normalized) || 0) + value);
    }
  });

  if (active.size === 0) {
    return { activeDays: 0, longestStreak: 0, bestDay: 0 };
  }

  const keys = Array.from(active.keys()).sort();
  let longestStreak = 1;
  let run = 1;
  let bestDay = 0;
  let previous: Date | null = null;

  for (const key of keys) {
    bestDay = Math.max(bestDay, active.get(key) || 0);
    const current = new Date(`${key}T00:00:00`);
    if (previous) {
      const diffDays = Math.round(
        (current.getTime() - previous.getTime()) / 86_400_000,
      );
      if (diffDays === 1) {
        run += 1;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 1;
      }
    }
    previous = current;
  }

  return { activeDays: active.size, longestStreak, bestDay };
};

interface LeetcodeData {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  submissionCalendar: Record<string, number>;
  activeYears: number[];
}

interface CodechefData {
  currentRating: number;
  highestRating: number;
  stars: string;
  globalRank: string | number;
  countryRank: string | number;
  heatMap: { date: string; value: number }[];
}

interface WebsiteData {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  submissionCalendar: Record<string, number>;
}

type DifficultyKey = "easy" | "medium" | "hard";

/* ──────────────────────────────────────────────────────────────────────────
   Small building blocks — kept local so the page reads as one design system.
   ────────────────────────────────────────────────────────────────────────── */

function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </label>
  );
}

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/25";

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-overlay animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, profile, resolvedAvatar, refreshProfile, loading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredDifficulty, setHoveredDifficulty] =
    useState<DifficultyKey | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [website, setWebsite] = useState("");

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codechefUsername, setCodechefUsername] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dsaCardRef = useRef<HTMLDivElement>(null);
  const [isNarrowDsa, setIsNarrowDsa] = useState(false);

  // Platform state — the consistency heatmap and the DSA card track their
  // platform selection independently, like takeuforward's profile page.
  const [consistencyMode, setConsistencyMode] =
    useState<ConsistencyMode>("all");
  const [dsaMode, setDsaMode] = useState<DsaMode>("website");
  const [consistencyRange, setConsistencyRange] =
    useState<HeatmapRange>("Last 12 months");
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [consistencyStats, setConsistencyStats] = useState({
    total: 0,
    activeDays: 0,
    maxStreak: 0,
  });

  const [leetcodeData, setLeetcodeData] = useState<LeetcodeData | null>(null);
  const [isLeetcodeLoading, setIsLeetcodeLoading] = useState(false);
  const [showLeetcodePrompt, setShowLeetcodePrompt] = useState(false);
  const [promptUsername, setPromptUsername] = useState("");

  const [codechefData, setCodechefData] = useState<CodechefData | null>(null);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isCodechefLoading, setIsCodechefLoading] = useState(false);
  const [showCodechefPrompt, setShowCodechefPrompt] = useState(false);
  const [codechefPromptUsername, setCodechefPromptUsername] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setRoleTitle(profile.role_title || "");
      setUniversity(profile.university || "");
      setGithubUrl(profile.github_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setTwitterUrl(profile.twitter_url || "");
      setWebsite(profile.website || "");
      setLeetcodeUsername(profile.leetcode_username || "");
      setCodechefUsername(profile.codechef_username || "");
    }
  }, [profile]);

  // ── ResizeObserver: detect narrow DSA Progress card ──
  useEffect(() => {
    const el = dsaCardRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrowDsa(entry.contentRect.width < 280);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Close the connect modals with Escape for keyboard users.
  useEffect(() => {
    if (!showLeetcodePrompt && !showCodechefPrompt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setShowLeetcodePrompt(false);
      setShowCodechefPrompt(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showLeetcodePrompt, showCodechefPrompt]);

  // Initial load for LeetCode if available
  useEffect(() => {
    if (profile?.leetcode_username && !leetcodeData && !isLeetcodeLoading) {
      fetchLeetcodeStats(profile.leetcode_username);
    }
  }, [profile?.leetcode_username]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Max 2MB allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    // Delete old avatar if it exists
    if (profile?.avatar_url) {
      await supabase.storage.from("avatars").remove([profile.avatar_url]);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("user_id", user.id);

    await refreshProfile();

    setUploading(false);
    toast({ title: "Avatar updated!" });
  };

  // Accept bare domains the way people actually paste them.
  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        role_title: roleTitle.trim(),
        university: university.trim(),
        github_url: normalizeUrl(githubUrl),
        linkedin_url: normalizeUrl(linkedinUrl),
        twitter_url: normalizeUrl(twitterUrl),
        website: normalizeUrl(website),
        leetcode_username: leetcodeUsername.trim(),
        codechef_username: codechefUsername.trim(),
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await refreshProfile();
      toast({ title: "Profile saved!" });
      setIsEditing(false);
    }
    setSaving(false);
  };

  const fetchLeetcodeStats = async (username: string, force = false) => {
    setIsLeetcodeLoading(true);
    try {
      // Data flows through the `leetcode-user` edge function, which queries
      // LeetCode's own GraphQL API server-side. The previous implementation
      // called the free public `alfa-leetcode-api.onrender.com` wrapper
      // straight from the browser, which is shared and rate-limited (HTTP 429)
      // — the cause of the intermittent "API is currently unavailable" toast.
      const result = await fetchLeetcodeUserStats(username, { force });
      const stats = result.stats;

      setLeetcodeData({
        totalSolved: stats.totalSolved,
        totalQuestions: stats.totalQuestions || 3000,
        easySolved: stats.easySolved,
        totalEasy: stats.totalEasy,
        mediumSolved: stats.mediumSolved,
        totalMedium: stats.totalMedium,
        hardSolved: stats.hardSolved,
        totalHard: stats.totalHard,
        submissionCalendar: stats.submissionCalendar,
        activeYears: stats.activeYears,
      });

      if (result.stale) {
        toast({
          title: "Showing cached LeetCode stats",
          description:
            "LeetCode is temporarily unreachable, so your last synced stats are displayed.",
        });
      } else if (Object.keys(stats.submissionCalendar).length === 0) {
        toast({
          title: "LeetCode calendar unavailable",
          description:
            "Solved counts imported, but LeetCode did not return calendar activity.",
        });
      }
    } catch (err) {
      if (err instanceof LeetcodeUserNotFoundError) {
        toast({
          title: "LeetCode fetch failed",
          description: "Invalid username or no data available",
          variant: "destructive",
        });
      } else {
        toast({
          title: "LeetCode API Error",
          description: "The API is currently unavailable. Try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLeetcodeLoading(false);
    }
  };

  const fetchCodechefStats = async (username: string) => {
    setIsCodechefLoading(true);
    try {
      // The old codechef-api.vercel.app endpoint is permanently disabled (HTTP 402).
      // competeapi provides a working CodeChef profile endpoint.
      const res = await fetch(
        `https://competeapi.vercel.app/user/codechef/${username}/`,
      );
      if (!res.ok) {
        throw new Error("CodeChef API is currently unavailable");
      }
      const data = await res.json();

      if (
        !data ||
        data.rating_number === undefined ||
        data.rating_number === null
      ) {
        toast({
          title: "CodeChef fetch failed",
          description: "Invalid handle or no data available",
          variant: "destructive",
        });
        return;
      }

      // Ranks can come back as whitespace-padded strings (e.g. "Inactive"); clean them.
      const cleanRank = (val: unknown): string | number => {
        if (typeof val === "number") return val;
        const trimmed = String(val ?? "").trim();
        return trimmed.length > 0 ? trimmed : "-";
      };

      const heatMap = Array.isArray(data.heatMap)
        ? data.heatMap.map((item: any) => ({
            date: item.date,
            value: item.value ?? 0,
          }))
        : [];

      setCodechefData({
        currentRating: data.rating_number ?? 0,
        highestRating: data.max_rank ?? 0,
        stars: data.rating ?? "N/A",
        globalRank: cleanRank(data.global_rank),
        countryRank: cleanRank(data.country_rank),
        heatMap,
      });
    } catch (err: any) {
      const message = err.message || "Failed to connect to CodeChef API";
      toast({
        title: "CodeChef API Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCodechefLoading(false);
    }
  };

  const ensurePlatformData = (mode: DsaMode) => {
    if (mode === "leetcode" && !leetcodeData && profile?.leetcode_username) {
      fetchLeetcodeStats(profile.leetcode_username);
    } else if (
      mode === "codechef" &&
      !codechefData &&
      profile?.codechef_username
    ) {
      fetchCodechefStats(profile.codechef_username);
    }
  };

  const handleConsistencyMode = (mode: ConsistencyMode) => {
    setConsistencyMode(mode);
    if (mode !== "all") ensurePlatformData(mode);
  };

  const handleDsaMode = (mode: DsaMode) => {
    setDsaMode(mode);
    ensurePlatformData(mode);
  };

  // Manual refresh: bypass all caches and pull fresh data from LeetCode.
  const handleRefreshLeetcode = () => {
    if (!profile?.leetcode_username || isLeetcodeLoading) return;
    fetchLeetcodeStats(profile.leetcode_username, true);
  };

  const fetchWebsiteStats = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("practice_problem_user_state")
        .select("problem_id, is_completed, updated_at, created_at")
        .eq("user_id", user.id)
        .eq("is_completed", true);

      if (error) throw error;

      let easy = 0,
        medium = 0,
        hard = 0;
      const calendar: Record<string, number> = {};
      const completedIds = new Set<string>();

      data?.forEach((row: any) => {
        completedIds.add(row.problem_id);

        const difficulty = PROBLEM_DIFFICULTY_MAP[row.problem_id];
        if (difficulty === "Easy") easy++;
        else if (difficulty === "Medium") medium++;
        else if (difficulty === "Hard") hard++;

        // No dedicated completed_at column exists; use updated_at (falls back to created_at)
        // as the best proxy for when the problem was marked complete.
        const completedAt = row.updated_at || row.created_at;
        if (completedAt) {
          const date = new Date(completedAt);
          if (!isNaN(date.getTime())) {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            calendar[dateStr] = (calendar[dateStr] || 0) + 1;
          }
        }
      });

      setSolvedProblemIds(completedIds);
      setWebsiteData({
        totalSolved: easy + medium + hard,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        submissionCalendar: calendar,
      });
    } catch (err) {
      console.error("Failed to fetch website stats:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWebsiteStats();
    }
  }, [user?.id]);

  const saveLeetcodePrompt = async () => {
    if (!promptUsername.trim() || !user) return;
    setIsLeetcodeLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ leetcode_username: promptUsername.trim() } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save username to DB",
        variant: "destructive",
      });
      setIsLeetcodeLoading(false);
      return;
    }
    setLeetcodeUsername(promptUsername.trim());
    await refreshProfile();
    setShowLeetcodePrompt(false);
    fetchLeetcodeStats(promptUsername.trim());
  };

  const saveCodechefPrompt = async () => {
    if (!codechefPromptUsername.trim() || !user) return;
    setIsCodechefLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ codechef_username: codechefPromptUsername.trim() } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save username to DB",
        variant: "destructive",
      });
      setIsCodechefLoading(false);
      return;
    }
    setCodechefUsername(codechefPromptUsername.trim());
    await refreshProfile();
    setShowCodechefPrompt(false);
    fetchCodechefStats(codechefPromptUsername.trim());
  };

  const codechefCalendar = useMemo(() => {
    const cal: Record<string, number> = {};
    if (codechefData?.heatMap) {
      codechefData.heatMap.forEach((item) => {
        cal[item.date] = item.value;
      });
    }
    return cal;
  }, [codechefData]);

  // Stats shown in the "At a glance" sidebar — derived from the DSA mode's
  // own calendar, so switching the DSA platform re-points every number.
  const glanceCalendar =
    dsaMode === "leetcode"
      ? leetcodeData?.submissionCalendar || EMPTY_CALENDAR
      : dsaMode === "codechef"
        ? codechefCalendar
        : websiteData?.submissionCalendar || EMPTY_CALENDAR;

  const glanceHighlights = useMemo(
    () => computeHighlights(glanceCalendar),
    [glanceCalendar],
  );

  // "All" merges every platform's calendar into one consistency heatmap.
  const allCalendar = useMemo(() => {
    const merged: Record<string, number> = {};
    const absorb = (calendar: Record<string, number>) => {
      Object.entries(calendar).forEach(([key, count]) => {
        const day = normalizeDayKey(key);
        const value = Number(count) || 0;
        if (day && value > 0) {
          merged[day] = (merged[day] || 0) + value;
        }
      });
    };
    absorb(websiteData?.submissionCalendar || EMPTY_CALENDAR);
    absorb(leetcodeData?.submissionCalendar || EMPTY_CALENDAR);
    absorb(codechefCalendar);
    return merged;
  }, [websiteData, leetcodeData, codechefCalendar]);

  const consistencyHeatmapMode: DsaMode =
    consistencyMode === "all" ? "website" : consistencyMode;
  const consistencyCalendar =
    consistencyMode === "all"
      ? allCalendar
      : consistencyMode === "leetcode"
        ? leetcodeData?.submissionCalendar || EMPTY_CALENDAR
        : consistencyMode === "codechef"
          ? codechefCalendar
          : websiteData?.submissionCalendar || EMPTY_CALENDAR;
  const consistencyIsLoading =
    (isLeetcodeLoading && consistencyMode === "leetcode") ||
    (isCodechefLoading && consistencyMode === "codechef") ||
    (!websiteData && consistencyMode === "website");

  const platformsConnected =
    1 +
    (profile?.leetcode_username ? 1 : 0) +
    (profile?.codechef_username ? 1 : 0);

  const consistencyRangeOptions = useMemo<HeatmapRange[]>(() => {
    const currentYear = new Date().getFullYear();
    const years =
      consistencyMode === "leetcode" && leetcodeData?.activeYears?.length
        ? leetcodeData.activeYears
        : [currentYear, currentYear - 1, currentYear - 2];
    return [
      "Last 12 months",
      ...Array.from(
        new Set(
          years
            .map((year) => Number(year))
            .filter(
              (year) => Number.isInteger(year) && year <= currentYear,
            ),
        ),
      ).sort((a, b) => b - a),
    ];
  }, [consistencyMode, leetcodeData]);

  const currentTotalSolved =
    dsaMode === "leetcode"
      ? leetcodeData?.totalSolved || 0
      : dsaMode === "website"
        ? websiteData?.totalSolved || 0
        : codechefData?.currentRating || 0;
  const currentEasySolved =
    dsaMode === "leetcode"
      ? leetcodeData?.easySolved || 0
      : websiteData?.easySolved || 0;
  const currentMediumSolved =
    dsaMode === "leetcode"
      ? leetcodeData?.mediumSolved || 0
      : websiteData?.mediumSolved || 0;
  const currentHardSolved =
    dsaMode === "leetcode"
      ? leetcodeData?.hardSolved || 0
      : websiteData?.hardSolved || 0;

  const currentTotalQuestions =
    dsaMode === "leetcode"
      ? leetcodeData?.totalQuestions || 3000
      : dsaMode === "website" ? TOTAL_WEBSITE_QUESTIONS : 0;

  // Sidebar headline number: "—" while a connected platform is still loading.
  const glanceSolved =
    dsaMode === "codechef"
      ? codechefData
        ? codechefData.currentRating.toLocaleString()
        : "—"
      : dsaMode === "leetcode"
        ? leetcodeData
          ? currentTotalSolved.toLocaleString()
          : profile?.leetcode_username
            ? "—"
            : "0"
        : currentTotalSolved.toLocaleString();

  // The connected-platform prompt lives where the stats would render, so a
  // user who switches tabs without linking an account gets a clear next step.
  const activePlatformConnected =
    dsaMode === "website" ||
    (dsaMode === "leetcode"
      ? Boolean(profile?.leetcode_username)
      : Boolean(profile?.codechef_username));

  const statsSegments = useMemo(() => {
    const circumference = 301.59;
    const gap = 8;

    const currentEasyTotal = dsaMode === "leetcode" ? (leetcodeData?.totalEasy || 1) : TOTAL_WEBSITE_EASY;
    const currentMediumTotal = dsaMode === "leetcode" ? (leetcodeData?.totalMedium || 1) : TOTAL_WEBSITE_MEDIUM;
    const currentHardTotal = dsaMode === "leetcode" ? (leetcodeData?.totalHard || 1) : TOTAL_WEBSITE_HARD;
    const totalDivisor = currentEasyTotal + currentMediumTotal + currentHardTotal || 1;

    const values: Array<{
      key: DifficultyKey;
      label: string;
      value: number;
      total: number;
      stroke: string;
      trackStroke: string;
    }> = [
      {
        key: "easy",
        label: "Easy",
        value: currentEasySolved,
        total: currentEasyTotal,
        stroke: "#00b8a3",
        trackStroke: "#00b8a333",
      },
      {
        key: "medium",
        label: "Medium",
        value: currentMediumSolved,
        total: currentMediumTotal,
        stroke: "#ffc01e",
        trackStroke: "#ffc01e33",
      },
      {
        key: "hard",
        label: "Hard",
        value: currentHardSolved,
        total: currentHardTotal,
        stroke: "#ef4743",
        trackStroke: "#ef474333",
      },
    ];

    let offset = 0;

    return values.map((segment) => {
      // Background track logic
      const trackRawLength = (circumference * segment.total) / totalDivisor;
      const trackVisibleLength = Math.max(0, trackRawLength - gap);
      const trackDasharray = `${trackVisibleLength} ${circumference - trackVisibleLength}`;
      const trackDashoffset = -offset;

      // Progress logic
      const progressRawLength = (circumference * segment.value) / totalDivisor;
      const progressVisibleLength = Math.min(progressRawLength, trackVisibleLength);
      const progressDasharray = `${progressVisibleLength} ${circumference - progressVisibleLength}`;
      const progressDashoffset = -offset;

      offset += trackRawLength;

      return {
        ...segment,
        trackDasharray,
        trackDashoffset,
        progressDasharray,
        progressDashoffset,
      };
    });
  }, [currentEasySolved, currentMediumSolved, currentHardSolved, dsaMode, leetcodeData]);

  // Per-topic completion from the practice sheet — real data replaces the
  // old "Subject progress" placeholder card.
  const topicProgress = useMemo(() => {
    return practiceData
      .map((topic) => {
        const total = topic.subtopics.reduce(
          (n, sub) => n + sub.problems.length,
          0,
        );
        const solved = topic.subtopics.reduce(
          (n, sub) =>
            n + sub.problems.filter((p) => solvedProblemIds.has(p.id)).length,
          0,
        );
        return { id: topic.id, title: topic.title, solved, total };
      })
      .sort((a, b) => b.solved - a.solved || b.total - a.total);
  }, [solvedProblemIds]);

  const startedTopics = topicProgress.filter((t) => t.solved > 0).length;

  const handleShare = async () => {
    const url = `${window.location.origin}/profile`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Profile link copied to clipboard" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Couldn't copy link",
        description: "Copy the URL from your browser's address bar instead.",
        variant: "destructive",
      });
    }
  };

  const joinedLabel = useMemo(() => {
    if (!user?.created_at) return null;
    const date = new Date(user.created_at);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [user?.created_at]);

  const socialLinks = [
    { key: "website", icon: Globe, label: "Website", value: profile?.website, display: profile?.website?.replace(/^https?:\/\//, "") },
    { key: "github", icon: Github, label: "GitHub", value: profile?.github_url, display: profile?.github_url?.split("/").pop() || "GitHub" },
    { key: "linkedin", icon: Linkedin, label: "LinkedIn", value: profile?.linkedin_url, display: profile?.linkedin_url?.split("/in/").pop() || "LinkedIn" },
    { key: "twitter", icon: Twitter, label: "X / Twitter", value: profile?.twitter_url, display: profile?.twitter_url?.replace(/^https?:\/\/(twitter\.com|x\.com)\//, "@") },
  ].filter((link) => link.value);

  const socialProfiles = socialLinks.filter((link) => link.key !== "website");
  const websiteLinks = socialLinks.filter((link) => link.key === "website");

  // ── Auth bootstrap skeleton ──
  if (loading) {
    return (
      <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-8 2xl:px-14">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/40" />
          </div>
          <div className="space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 2xl:px-14 animate-in fade-in duration-500">
      {/* ── Connect modals ── */}
      {showLeetcodePrompt && (
        <ModalShell onClose={() => setShowLeetcodePrompt(false)}>
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 size={18} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Link LeetCode account
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your LeetCode username to sync solved counts and your
            submission heatmap.
          </p>
          <input
            value={promptUsername}
            onChange={(e) => setPromptUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveLeetcodePrompt();
            }}
            placeholder="e.g. aritr_dutta"
            className={`mt-4 ${INPUT_CLASS}`}
            autoFocus
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowLeetcodePrompt(false)}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={saveLeetcodePrompt}
              disabled={isLeetcodeLoading || !promptUsername.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
            >
              {isLeetcodeLoading && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Connect
            </button>
          </div>
        </ModalShell>
      )}

      {showCodechefPrompt && (
        <ModalShell onClose={() => setShowCodechefPrompt(false)}>
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2 size={18} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Link CodeChef account
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your CodeChef handle to sync rating, stars, and ranks.
          </p>
          <input
            value={codechefPromptUsername}
            onChange={(e) => setCodechefPromptUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCodechefPrompt();
            }}
            placeholder="e.g. codechef_user"
            className={`mt-4 ${INPUT_CLASS}`}
            autoFocus
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowCodechefPrompt(false)}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={saveCodechefPrompt}
              disabled={isCodechefLoading || !codechefPromptUsername.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
            >
              {isCodechefLoading && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Connect
            </button>
          </div>
        </ModalShell>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ══════════════ Sidebar: glance, profiles, links ══════════════ */}
        <div className="order-2 space-y-5 xl:order-1">
          {/* At a glance */}
          <Card className="p-5">
            <SectionHeading>At a glance</SectionHeading>
            <div className="mt-4 space-y-3.5">
              <GlanceRow
                label={
                  dsaMode === "codechef" ? "Current rating" : "Problems solved"
                }
              >
                {glanceSolved}
              </GlanceRow>
              <GlanceRow label="Best streak">
                <span className="inline-flex items-center gap-1.5">
                  <Flame
                    size={13}
                    className="text-orange-500 dark:text-orange-400"
                  />
                  {glanceHighlights.longestStreak}{" "}
                  {glanceHighlights.longestStreak === 1 ? "day" : "days"}
                </span>
              </GlanceRow>
              {dsaMode === "codechef" ? (
                <GlanceRow label="Global rank">
                  {codechefData ? String(codechefData.globalRank) : "—"}
                </GlanceRow>
              ) : (
                <GlanceRow label="Active days">
                  {glanceHighlights.activeDays}
                </GlanceRow>
              )}
            </div>
          </Card>

          {/* Coding profiles */}
          <Card className="p-5">
            <SectionHeading>Coding profiles</SectionHeading>
            <div className="mt-3 space-y-1">
              <CodingProfileRow
                icon={Code2}
                name="LeetCode"
                username={profile?.leetcode_username}
                url={
                  profile?.leetcode_username
                    ? `https://leetcode.com/u/${profile.leetcode_username}/`
                    : undefined
                }
                onConnect={() => setShowLeetcodePrompt(true)}
              />
              <CodingProfileRow
                icon={Trophy}
                name="CodeChef"
                username={profile?.codechef_username}
                url={
                  profile?.codechef_username
                    ? `https://www.codechef.com/users/${profile.codechef_username}`
                    : undefined
                }
                onConnect={() => setShowCodechefPrompt(true)}
              />
            </div>
          </Card>

          {/* Social links */}
          <Card className="p-5">
            <SectionHeading>Social links</SectionHeading>
            <div className="mt-3">
              {socialProfiles.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {socialProfiles.map((link) => (
                    <a
                      key={link.key}
                      href={link.value as string}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:text-primary"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                        <link.icon size={13} />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {link.display}
                      </span>
                      <ExternalLink
                        size={12}
                        className="shrink-0 text-muted-foreground/50"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-dashed border-border py-7 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
                    <Link2 size={15} />
                  </span>
                  <span className="text-xs font-medium">No links added</span>
                </button>
              )}
            </div>
          </Card>

          {/* Other links */}
          <Card className="p-5">
            <SectionHeading>Other links</SectionHeading>
            <div className="mt-3">
              {websiteLinks.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {websiteLinks.map((link) => (
                    <a
                      key={link.key}
                      href={link.value as string}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 py-2.5 transition-colors first:pt-0 last:pb-0 hover:text-primary"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                        <link.icon size={13} />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {link.display}
                      </span>
                      <ExternalLink
                        size={12}
                        className="shrink-0 text-muted-foreground/50"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-dashed border-border py-7 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
                    <Link2 size={15} />
                  </span>
                  <span className="text-xs font-medium">No links added</span>
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* ══════════════ Main: hero (edit form while editing) ══════════════ */}
        <div className="order-1 min-w-0 space-y-6">
          {isEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-6"
            >
              <Card className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Edit profile
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your details across AlgoGuru.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Basic details */}
                  <section className="space-y-4">
                    <SectionHeading>Basic details</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <FieldLabel>Display name</FieldLabel>
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="John Doe"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Role / title</FieldLabel>
                        <input
                          value={roleTitle}
                          onChange={(e) => setRoleTitle(e.target.value)}
                          placeholder="Software Engineer"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <FieldLabel>Education / university</FieldLabel>
                        <input
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="E.g. Academy of Technology"
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </section>

                  {/* About */}
                  <section className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FieldLabel>About me</FieldLabel>
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground/70">
                        {bio.length}/{BIO_MAX_LENGTH}
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) =>
                        setBio(e.target.value.slice(0, BIO_MAX_LENGTH))
                      }
                      placeholder="Tell us about yourself…"
                      className={`${INPUT_CLASS} min-h-[110px] resize-y`}
                    />
                  </section>

                  {/* Coding profiles */}
                  <section className="space-y-4">
                    <SectionHeading>Coding profiles</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <FieldLabel>LeetCode username</FieldLabel>
                        <input
                          value={leetcodeUsername}
                          onChange={(e) => setLeetcodeUsername(e.target.value)}
                          placeholder="e.g. aritr_dutta"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>CodeChef handle</FieldLabel>
                        <input
                          value={codechefUsername}
                          onChange={(e) => setCodechefUsername(e.target.value)}
                          placeholder="e.g. codechef_user"
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Social links */}
                  <section className="space-y-4">
                    <SectionHeading>Social links</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      <div className="space-y-1.5">
                        <FieldLabel>GitHub</FieldLabel>
                        <input
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/…"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>LinkedIn</FieldLabel>
                        <input
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/…"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>X / Twitter</FieldLabel>
                        <input
                          value={twitterUrl}
                          onChange={(e) => setTwitterUrl(e.target.value)}
                          placeholder="https://x.com/…"
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Website</FieldLabel>
                        <input
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://…"
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Sticky save bar */}
                <div className="mt-8 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save changes
                  </button>
                </div>
              </Card>
            </form>
          ) : (
            <>
              {/* ── Hero ── */}
              <Card className="overflow-hidden">
                <div className="relative h-36 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.35) 1px, transparent 0)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-primary/15 bg-primary/10" />
                  <div className="absolute -right-6 -top-36 h-72 w-72 rounded-full border border-primary/10" />
                  {joinedLabel && (
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground backdrop-blur">
                      <CalendarDays size={11} />
                      Joined {joinedLabel}
                    </div>
                  )}
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur transition-colors hover:bg-muted"
                    >
                      <Edit2 size={12} />
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      title="Share profile"
                      aria-label="Share profile"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-muted"
                    >
                      {copied ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Share2 size={13} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="-mt-12 px-5 pb-6 sm:px-6">
                  <div className="group relative inline-block">
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt="Avatar"
                        className="h-24 w-24 rounded-full border border-border object-cover ring-4 ring-card"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-2xl font-bold text-primary ring-4 ring-card">
                        {displayName?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          "?"}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Change avatar"
                      aria-label="Change avatar"
                      className="absolute -bottom-1 -right-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-foreground text-background shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      {displayName || "Add your name"}
                    </h2>
                    {roleTitle ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        <Briefcase size={10} />
                        {roleTitle}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <Briefcase size={10} />
                        Add a role
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    {user.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={11} />
                        {user.email}
                      </span>
                    )}
                    {university && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap size={11} />
                          {university}
                        </span>
                      </>
                    )}
                  </div>

                  {bio && (
                    <p className="mt-3 line-clamp-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {bio}
                    </p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Consistency + DSA progress sit below the sidebar column (which
            ends with Other links) so the heatmap and the analysis panels get
            the full page width ── */}
      {!isEditing && (
        <div className="mt-6 space-y-6">
          {/* ── Consistency ── */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>Consistency</SectionHeading>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {platformsConnected}{" "}
                  {platformsConnected === 1 ? "platform" : "platforms"}{" "}
                  connected
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRangeOpen((v) => !v)}
                    className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {consistencyRange === "Last 12 months"
                      ? "12 Months"
                      : consistencyRange}
                    <ChevronDown
                      size={12}
                      className={cn(
                        "transition-transform duration-200",
                        isRangeOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isRangeOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsRangeOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
                        <div className="border-b border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                          Select range
                        </div>
                        {consistencyRangeOptions.map((option) => (
                          <button
                            key={String(option)}
                            type="button"
                            onClick={() => {
                              setConsistencyRange(option);
                              setIsRangeOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-xs font-medium transition-colors hover:bg-muted",
                              consistencyRange === option
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {option === "Last 12 months"
                              ? "Last 12 months"
                              : option}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(
                [
                  { mode: "all", icon: LayoutGrid, label: "All" },
                  { mode: "website", icon: Target, label: "Algoguru" },
                  { mode: "leetcode", icon: Code2, label: "LeetCode" },
                  { mode: "codechef", icon: Trophy, label: "CodeChef" },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <PlatformPill
                  key={mode}
                  active={consistencyMode === mode}
                  onClick={() => handleConsistencyMode(mode)}
                  icon={Icon}
                  label={label}
                />
              ))}
            </div>

            <div className="mt-4">
              <ActivityHeatmap
                variant="embedded"
                websiteCalendar={consistencyCalendar}
                leetcodeCalendar={
                  leetcodeData?.submissionCalendar || EMPTY_CALENDAR
                }
                leetcodeActiveYears={leetcodeData?.activeYears || []}
                codechefCalendar={codechefCalendar}
                dataMode={consistencyHeatmapMode}
                isLoading={consistencyIsLoading}
                range={consistencyRange}
                onRangeChange={setConsistencyRange}
                rangeOptions={consistencyRangeOptions}
                onStatsChange={setConsistencyStats}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-border/50 pt-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <div className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                    {consistencyStats.total}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Contributions ·{" "}
                    {consistencyRange === "Last 12 months"
                      ? "12 mos"
                      : consistencyRange}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                    {consistencyStats.activeDays}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Active days
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums tracking-tight text-foreground">
                    {consistencyStats.maxStreak}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Best streak
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                <span>Less</span>
                <div className="flex items-center gap-[2px]">
                  {(MODE_INTENSITY_COLORS[consistencyHeatmapMode] ||
                    MODE_INTENSITY_COLORS.website).map(
                    (colorClass, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-2.5 w-2.5 rounded-[2px]",
                          colorClass,
                        )}
                      />
                    ),
                  )}
                </div>
                <span>More</span>
              </div>
            </div>
          </Card>

          {/* ── DSA progress ── */}
          <div
            ref={dsaCardRef}
            className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>DSA Progress</SectionHeading>
              {isNarrowDsa ? (
                <div className="relative w-full sm:w-auto">
                  <select
                    value={dsaMode}
                    onChange={(e) =>
                      handleDsaMode(e.target.value as DsaMode)
                    }
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-muted px-3 py-2 pr-8 text-xs font-medium text-foreground transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
                  >
                    <option value="website">Algoguru</option>
                    <option value="leetcode">LeetCode</option>
                    <option value="codechef">CodeChef</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {(["website", "leetcode", "codechef"] as const).map(
                    (mode) => (
                      <PlatformPill
                        key={mode}
                        active={dsaMode === mode}
                        onClick={() => handleDsaMode(mode)}
                        icon={
                          mode === "website"
                            ? Target
                            : mode === "leetcode"
                              ? Code2
                              : Trophy
                        }
                        label={
                          mode === "website"
                            ? "Algoguru"
                            : mode === "leetcode"
                              ? "LeetCode"
                              : "CodeChef"
                        }
                      />
                    ),
                  )}
                  {dsaMode === "leetcode" &&
                    profile?.leetcode_username && (
                      <button
                        onClick={handleRefreshLeetcode}
                        disabled={isLeetcodeLoading}
                        title="Refresh LeetCode stats"
                        aria-label="Refresh LeetCode stats"
                        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        <RefreshCw
                          size={12}
                          className={isLeetcodeLoading ? "animate-spin" : ""}
                        />
                        Refresh
                      </button>
                    )}
                </div>
              )}
            </div>

            {!activePlatformConnected ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Link2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Connect your{" "}
                    {dsaMode === "leetcode" ? "LeetCode" : "CodeChef"}{" "}
                    account
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sync solved counts, ratings, and your submission
                    heatmap.
                  </p>
                </div>
                <button
                  onClick={() =>
                    dsaMode === "leetcode"
                      ? setShowLeetcodePrompt(true)
                      : setShowCodechefPrompt(true)
                  }
                  className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-95"
                >
                  Connect{" "}
                  {dsaMode === "leetcode" ? "LeetCode" : "CodeChef"}
                </button>
              </div>
            ) : (isLeetcodeLoading && dsaMode === "leetcode") ||
              (isCodechefLoading && dsaMode === "codechef") ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
              </div>
            ) : (
              <div
                className={cn(
                  "mt-5 grid gap-4",
                  dsaMode !== "leetcode" && !isNarrowDsa
                    ? "sm:grid-cols-2"
                    : "",
                )}
              >
                {/* Donut panel */}
                <div
                  className={cn(
                    "flex flex-col rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5",
                    dsaMode === "leetcode" && "sm:col-span-2",
                  )}
                >
                  <span className="text-xs font-semibold text-foreground">
                    DSA Progress
                  </span>
                  <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-7 min-[480px]:flex-row min-[480px]:gap-10">
                    {/* Donut Chart */}
                    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                      <svg
                        viewBox="0 0 128 128"
                        className="absolute inset-0 h-full w-full -rotate-90 transform overflow-visible"
                      >
                        <defs>
                          <filter
                            id="glow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                          >
                            <feGaussianBlur
                              stdDeviation="3"
                              result="blur"
                            />
                            <feComposite
                              in="SourceGraphic"
                              in2="blur"
                              operator="over"
                            />
                          </filter>
                        </defs>
                        {dsaMode !== "codechef" &&
                          statsSegments.map((segment) => {
                            const isHighlighted =
                              !hoveredDifficulty ||
                              hoveredDifficulty === segment.key;
                            return (
                              <g
                                key={segment.key}
                                className={cn(
                                  "transition-opacity duration-300",
                                  isHighlighted
                                    ? "opacity-100"
                                    : "opacity-30",
                                )}
                              >
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="48"
                                  fill="none"
                                  stroke={segment.trackStroke}
                                  strokeLinecap="round"
                                  strokeWidth="6"
                                  strokeDasharray={segment.trackDasharray}
                                  strokeDashoffset={
                                    segment.trackDashoffset
                                  }
                                />
                                {segment.value > 0 && (
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="48"
                                    fill="none"
                                    stroke={segment.stroke}
                                    strokeLinecap="round"
                                    strokeWidth="6"
                                    strokeDasharray={
                                      segment.progressDasharray
                                    }
                                    strokeDashoffset={
                                      segment.progressDashoffset
                                    }
                                    filter={
                                      isHighlighted ? "url(#glow)" : "none"
                                    }
                                    className="transition-all duration-1000 ease-out"
                                  />
                                )}
                              </g>
                            );
                          })}
                      </svg>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="mb-1 text-[28px] font-semibold leading-none tracking-tight text-foreground">
                          {currentTotalSolved}
                        </span>
                        {dsaMode !== "codechef" && (
                          <>
                            <div className="my-1 h-[1px] w-8 bg-border" />
                            <span className="text-[12px] font-medium tracking-wider text-muted-foreground">
                              {currentTotalQuestions}
                            </span>
                          </>
                        )}
                        {dsaMode === "codechef" && (
                          <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                            Rating
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Legend */}
                    {dsaMode !== "codechef" && (
                      <div
                        className="flex flex-col gap-3.5"
                        onMouseLeave={() => setHoveredDifficulty(null)}
                      >
                        {statsSegments.map((segment) => {
                          const isActive =
                            !hoveredDifficulty ||
                            hoveredDifficulty === segment.key;
                          return (
                            <div
                              key={segment.key}
                              onMouseEnter={() =>
                                setHoveredDifficulty(segment.key)
                              }
                              className={cn(
                                "flex cursor-pointer items-center gap-2.5 transition-opacity duration-300",
                                isActive ? "opacity-100" : "opacity-40",
                              )}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-[3px]"
                                style={{ backgroundColor: segment.stroke }}
                              />
                              <span className="w-14 text-xs font-medium text-muted-foreground">
                                {segment.label}
                              </span>
                              <span className="text-xs font-semibold tabular-nums text-foreground">
                                {segment.value}
                                <span className="text-muted-foreground/50">
                                  {" "}
                                  / {segment.total}
                                </span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {dsaMode === "codechef" && (
                      <div className="flex flex-col gap-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-[3px] bg-[#eab308]" />
                          <span className="w-14 text-xs font-medium text-muted-foreground">
                            Stars
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-[#eab308]">
                            {codechefData?.stars || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-[3px] bg-muted-foreground/40" />
                          <span className="w-14 text-xs font-medium text-muted-foreground">
                            Global
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {codechefData?.globalRank || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-[3px] bg-muted-foreground/40" />
                          <span className="w-14 text-xs font-medium text-muted-foreground">
                            Country
                          </span>
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {codechefData?.countryRank || "-"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Topic-wise analysis (website practice sheet) */}
                {dsaMode === "website" && (
                  <div className="flex flex-col rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                    <span className="text-xs font-semibold text-foreground">
                      DSA Topic-wise Analysis
                    </span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">
                      {startedTopics} of {topicProgress.length} topics
                      started · AlgoGuru practice sheet
                    </span>
                    {currentTotalSolved === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                          <Target size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            No problems solved yet
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Track your progress across every DSA topic.
                          </p>
                        </div>
                        <Link
                          to="/practice"
                          className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-95"
                        >
                          Start practising
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-4 max-h-[300px] flex-1 space-y-3 overflow-y-auto pr-1">
                        {topicProgress.map((topic) => {
                          const maxSolved = topicProgress[0]?.solved || 1;
                          const width =
                            topic.solved > 0
                              ? Math.max(
                                  8,
                                  Math.round(
                                    (topic.solved / maxSolved) * 85,
                                  ),
                                )
                              : 0;
                          return (
                            <div
                              key={topic.id}
                              className="flex items-center gap-3"
                            >
                              <span className="w-24 shrink-0 truncate text-right text-[11px] font-medium text-muted-foreground sm:w-32">
                                {topic.title}
                              </span>
                              <div className="relative h-4 flex-1 rounded-[4px] bg-background/60">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-[4px] bg-primary/85 transition-all duration-700"
                                  style={{ width: `${width}%` }}
                                />
                                <span
                                  className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold tabular-nums text-foreground"
                                  style={{ left: `calc(${width}% + 6px)` }}
                                >
                                  {topic.solved}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-4 border-t border-border/60 pt-3">
                      <Link
                        to="/practice"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                      >
                        Open practice sheet
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Rating details (CodeChef) */}
                {dsaMode === "codechef" && (
                  <div className="flex flex-col rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                    <span className="text-xs font-semibold text-foreground">
                      Rating details
                    </span>
                    <div className="mt-4 flex-1 space-y-3.5">
                      <GlanceRow label="Highest rating">
                        {codechefData
                          ? String(codechefData.highestRating)
                          : "—"}
                      </GlanceRow>
                      <GlanceRow label="Stars">
                        <span className="text-[#eab308]">
                          {codechefData?.stars || "N/A"}
                        </span>
                      </GlanceRow>
                      <GlanceRow label="Global rank">
                        {codechefData
                          ? String(codechefData.globalRank)
                          : "—"}
                      </GlanceRow>
                      <GlanceRow label="Country rank">
                        {codechefData
                          ? String(codechefData.countryRank)
                          : "—"}
                      </GlanceRow>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Local helpers
   ────────────────────────────────────────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function PlatformPill({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function GlanceRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {children}
      </span>
    </div>
  );
}

function CodingProfileRow({
  icon: Icon,
  name,
  username,
  url,
  onConnect,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  name: string;
  username?: string | null;
  url?: string;
  onConnect: () => void;
}) {
  const connected = Boolean(username);
  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{name}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {connected ? `@${username}` : "Not connected"}
        </div>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
          <Check size={11} />
          Synced
        </span>
      ) : (
        <span className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          Connect
        </span>
      )}
    </>
  );

  if (connected && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/40"
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40"
    >
      {inner}
    </button>
  );
}

