import { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { cn } from "@/lib/utils";
import { practiceData } from "@/data/practiceData";

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

const parseLeetcodeCalendarPayload = (
  payload: any,
): { calendar: Record<string, number>; activeYears: number[] } => {
  const calendarSource =
    payload?.data?.matchedUser?.userCalendar ??
    payload?.matchedUser?.userCalendar ??
    payload;

  const rawCalendar =
    calendarSource?.submissionCalendar ?? payload?.submissionCalendar;

  let parsedCalendar: Record<string, unknown> = {};
  try {
    if (typeof rawCalendar === "string") {
      parsedCalendar = JSON.parse(rawCalendar);
    } else if (rawCalendar && typeof rawCalendar === "object") {
      parsedCalendar = rawCalendar;
    }
  } catch (e) {
    console.error("Failed to parse LeetCode calendar", e);
  }

  const calendar = Object.entries(parsedCalendar).reduce<
    Record<string, number>
  >((acc, [dateKey, value]) => {
    const count = Number(value);
    if (dateKey && Number.isFinite(count) && count > 0) {
      acc[dateKey] = (acc[dateKey] || 0) + count;
    }
    return acc;
  }, {});

  const activeYears = Array.isArray(calendarSource?.activeYears)
    ? calendarSource.activeYears
        .map((year: unknown) => Number(year))
        .filter((year: number) => Number.isInteger(year))
    : [];

  return { calendar, activeYears };
};

const mergeLeetcodeCalendars = (
  calendars: Array<Record<string, number>>,
): Record<string, number> => {
  return calendars.reduce<Record<string, number>>((acc, calendar) => {
    Object.entries(calendar).forEach(([dateKey, count]) => {
      acc[dateKey] = (acc[dateKey] || 0) + count;
    });
    return acc;
  }, {});
};

interface CodechefData {
  currentRating: number;
  highestRating: number;
  stars: string;
  globalRank: string | number;
  countryRank: string | number;
  heatMap: { date: string; value: number }[];
}

type DifficultyKey = "easy" | "medium" | "hard";

export default function Profile() {
  const { user, profile, resolvedAvatar, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [hoveredDifficulty, setHoveredDifficulty] =
    useState<DifficultyKey | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [website, setWebsite] = useState("");

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codechefUsername, setCodechefUsername] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform State
  const [dataMode, setDataMode] = useState<"website" | "leetcode" | "codechef">(
    "website",
  );

  const [leetcodeData, setLeetcodeData] = useState<LeetcodeData | null>(null);
  const [isLeetcodeLoading, setIsLeetcodeLoading] = useState(false);
  const [showLeetcodePrompt, setShowLeetcodePrompt] = useState(false);
  const [promptUsername, setPromptUsername] = useState("");

  const [codechefData, setCodechefData] = useState<CodechefData | null>(null);
  const [websiteData, setWebsiteData] = useState<any>(null);
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
      setWebsite(profile.website || "");
      setLeetcodeUsername(profile.leetcode_username || "");
      setCodechefUsername(profile.codechef_username || "");
    }
  }, [profile]);

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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio: bio,
        role_title: roleTitle,
        university: university,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        website: website,
        leetcode_username: leetcodeUsername,
        codechef_username: codechefUsername,
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

  const fetchLeetcodeStats = async (username: string) => {
    setIsLeetcodeLoading(true);
    try {
      // The /solved endpoint returns the actual solved counts; the base profile
      // endpoint does NOT. /calendar returns the submission heatmap.
      const [solvedRes, calendarRes] = await Promise.all([
        fetch(`https://alfa-leetcode-api.onrender.com/${username}/solved`),
        fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`),
      ]);

      if (!solvedRes.ok) {
        throw new Error("Failed to fetch LeetCode data");
      }

      const solvedData = await solvedRes.json();
      const calendarData = calendarRes.ok ? await calendarRes.json() : {};

      if (solvedData.errors || solvedData.solvedProblem === undefined) {
        toast({
          title: "LeetCode fetch failed",
          description: "Invalid username or no data available",
          variant: "destructive",
        });
        return;
      }

      // Total questions available on LeetCode (used as the ring denominator).
      const allQuestionsCount: Array<{ difficulty: string; count: number }> =
        solvedData.totalSubmissionNum ?? [];
      const allCount = allQuestionsCount.find((q) => q.difficulty === "All")
        ?.count;
      const totalEasy =
        allQuestionsCount.find((q) => q.difficulty === "Easy")?.count ?? 0;
      const totalMedium =
        allQuestionsCount.find((q) => q.difficulty === "Medium")?.count ?? 0;
      const totalHard =
        allQuestionsCount.find((q) => q.difficulty === "Hard")?.count ?? 0;

      const baseCalendar = parseLeetcodeCalendarPayload(calendarData);
      const currentYear = new Date().getFullYear();
      const yearsToFetch = Array.from(
        new Set(
          (baseCalendar.activeYears.length > 0
            ? baseCalendar.activeYears
            : [currentYear, currentYear - 1, currentYear - 2]
          ).filter((year) => year <= currentYear),
        ),
      );

      // Fetch each year's calendar with a small delay to avoid rate limits
      const yearlyCalendars: Array<Record<string, number>> = [];
      for (let i = 0; i < yearsToFetch.length; i++) {
        const year = yearsToFetch[i];
        try {
          const res = await fetch(
            `https://alfa-leetcode-api.onrender.com/${username}/calendar?year=${year}`,
          );
          if (res.ok) {
            const yearData = await res.json();
            const parsedYearCalendar = parseLeetcodeCalendarPayload(yearData);
            yearlyCalendars.push(parsedYearCalendar.calendar);
          }
        } catch (e) {
          console.warn(`Failed to fetch LeetCode calendar for year ${year}`, e);
        }
        // Add a small delay between API calls to avoid hitting rate limits
        if (i < yearsToFetch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      let parsedCalendar = mergeLeetcodeCalendars([
        baseCalendar.calendar,
        ...yearlyCalendars
      ]);

      let activeYears =
        baseCalendar.activeYears.length > 0
          ? baseCalendar.activeYears
          : Array.from(
              new Set(
                Object.keys(parsedCalendar)
                  .map((dateKey) => {
                    const timestamp = Number(dateKey);
                    if (Number.isFinite(timestamp)) {
                      return new Date(timestamp * 1000).getUTCFullYear();
                    }
                    const parsedDate = new Date(dateKey);
                    return Number.isNaN(parsedDate.getTime())
                      ? null
                      : parsedDate.getFullYear();
                  })
                  .filter((year): year is number => year !== null),
              ),
            );

      if (calendarRes.ok && baseCalendar.activeYears.length === 0) {
        const legacyCalendarYears = Object.keys(baseCalendar.calendar)
          .map((dateKey) => {
            const timestamp = Number(dateKey);
            if (Number.isFinite(timestamp)) {
              return new Date(timestamp * 1000).getUTCFullYear();
            }
            const parsedDate = new Date(dateKey);
            return Number.isNaN(parsedDate.getTime())
              ? null
              : parsedDate.getFullYear();
          })
          .filter((year): year is number => year !== null);
        if (legacyCalendarYears.length > 0) {
          activeYears.push(...legacyCalendarYears);
        }
      }

      if (Object.keys(parsedCalendar).length === 0) {
        toast({
          title: "LeetCode calendar unavailable",
          description:
            "Solved counts imported, but LeetCode did not return calendar activity.",
        });
      }

      setLeetcodeData({
        totalSolved: solvedData.solvedProblem ?? 0,
        totalQuestions: allCount ?? 3000,
        easySolved: solvedData.easySolved ?? 0,
        totalEasy,
        mediumSolved: solvedData.mediumSolved ?? 0,
        totalMedium,
        hardSolved: solvedData.hardSolved ?? 0,
        totalHard,
        submissionCalendar: parsedCalendar,
        activeYears: Array.from(new Set(activeYears)).sort((a, b) => b - a),
      });
    } catch (err) {
      toast({
        title: "LeetCode API Error",
        description: "The API is currently unavailable. Try again later.",
        variant: "destructive",
      });
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

  const handleModeToggle = (mode: "website" | "leetcode" | "codechef") => {
    setDataMode(mode);
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

      data?.forEach((row: any) => {
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
      .update({ leetcode_username: promptUsername } as any)
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
    setLeetcodeUsername(promptUsername);
    await refreshProfile();
    setShowLeetcodePrompt(false);
    fetchLeetcodeStats(promptUsername);
  };

  const saveCodechefPrompt = async () => {
    if (!codechefPromptUsername.trim() || !user) return;
    setIsCodechefLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ codechef_username: codechefPromptUsername } as any)
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
    setCodechefUsername(codechefPromptUsername);
    await refreshProfile();
    setShowCodechefPrompt(false);
    fetchCodechefStats(codechefPromptUsername);
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

  const currentTotalSolved =
    dataMode === "leetcode"
      ? leetcodeData?.totalSolved || 0
      : dataMode === "website"
        ? websiteData?.totalSolved || 0
        : codechefData?.currentRating || 0;
  const currentEasySolved =
    dataMode === "leetcode"
      ? leetcodeData?.easySolved || 0
      : websiteData?.easySolved || 0;
  const currentMediumSolved =
    dataMode === "leetcode"
      ? leetcodeData?.mediumSolved || 0
      : websiteData?.mediumSolved || 0;
  const currentHardSolved =
    dataMode === "leetcode"
      ? leetcodeData?.hardSolved || 0
      : websiteData?.hardSolved || 0;

  const currentTotalQuestions =
    dataMode === "leetcode"
      ? (leetcodeData?.totalQuestions || 3000)
      : (dataMode === "website" ? TOTAL_WEBSITE_QUESTIONS : 0);

  const statsSegments = useMemo(() => {
    const circumference = 301.59;
    const gap = 8;
    
    const currentEasyTotal = dataMode === "leetcode" ? (leetcodeData?.totalEasy || 1) : TOTAL_WEBSITE_EASY;
    const currentMediumTotal = dataMode === "leetcode" ? (leetcodeData?.totalMedium || 1) : TOTAL_WEBSITE_MEDIUM;
    const currentHardTotal = dataMode === "leetcode" ? (leetcodeData?.totalHard || 1) : TOTAL_WEBSITE_HARD;
    const totalDivisor = currentEasyTotal + currentMediumTotal + currentHardTotal || 1;

    const values = [
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
  }, [currentEasySolved, currentMediumSolved, currentHardSolved, dataMode, leetcodeData]);

  return (
    <div className="flex-1 min-h-screen bg-background text-foreground p-4 lg:p-8 flex flex-col lg:flex-row gap-6 pb-20 animate-in fade-in duration-700 relative">
      {showLeetcodePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 zoom-in-95 animate-in">
            <h3 className="text-lg font-bold text-foreground">
              Link LeetCode Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your LeetCode username to sync your progress and heatmap.
            </p>
            <input
              value={promptUsername}
              onChange={(e) => setPromptUsername(e.target.value)}
              placeholder="e.g. aritr_dutta"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLeetcodePrompt(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveLeetcodePrompt}
                disabled={isLeetcodeLoading || !promptUsername.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isLeetcodeLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodechefPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 zoom-in-95 animate-in">
            <h3 className="text-lg font-bold text-foreground">
              Link CodeChef Account
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your CodeChef handle to sync your stats.
            </p>
            <input
              value={codechefPromptUsername}
              onChange={(e) => setCodechefPromptUsername(e.target.value)}
              placeholder="e.g. codechef_user"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCodechefPrompt(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveCodechefPrompt}
                disabled={isCodechefLoading || !codechefPromptUsername.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isCodechefLoading && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold bg-primary/20 text-primary border border-primary/20">
                  {displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "?"}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center border-2 border-background shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50 z-10"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin w-3 h-3" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {displayName || "Add your name"}
              </h1>
              <p className="text-xs text-primary/80 font-medium">
                {user?.email?.split("@")[0] || "username"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-xs font-semibold"
            >
              <Edit2 size={14} />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-colors text-xs font-semibold">
              <Share2 size={14} />
              Share
            </button>
          </div>

          <div className="space-y-4 text-xs font-medium text-muted-foreground">
            <h3 className="text-sm font-bold text-foreground mb-2">
              Basic Information
            </h3>
            {roleTitle && (
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-muted-foreground/60" />
                <span>{roleTitle}</span>
              </div>
            )}
            {university && (
              <div className="flex items-center gap-3">
                <GraduationCap size={16} className="text-muted-foreground/60" />
                <span>{university}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-muted-foreground/60" />
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors truncate"
                >
                  {website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {githubUrl && (
              <div className="flex items-center gap-3">
                <Github size={16} className="text-muted-foreground/60" />
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors truncate"
                >
                  {githubUrl.split("/").pop() || "GitHub"}
                </a>
              </div>
            )}
            {linkedinUrl && (
              <div className="flex items-center gap-3">
                <Linkedin size={16} className="text-muted-foreground/60" />
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors truncate"
                >
                  {linkedinUrl.split("/in/").pop() || "LinkedIn"}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        {isEditing ? (
          <div className="bg-card text-card-foreground rounded-2xl p-6 md:p-10 border border-border/40 shadow-xl space-y-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Role / Title
                </label>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Education / University
                </label>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="E.g. Academy of Technology"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                About Me (Bio)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 min-h-[100px] rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  LeetCode Username
                </label>
                <input
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="e.g. aritr_dutta"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CodeChef Handle
                </label>
                <input
                  value={codechefUsername}
                  onChange={(e) => setCodechefUsername(e.target.value)}
                  placeholder="e.g. codechef_user"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  GitHub
                </label>
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  LinkedIn
                </label>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Website
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              <div className="bg-[#1C1C1C] text-white rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col relative min-h-[320px] xl:col-span-2 2xl:col-span-1 overflow-hidden">
                <div className="flex flex-row items-center justify-between w-full mb-8 relative z-10">
                  <h3 className="text-[15px] font-semibold tracking-wide text-white/90 shrink-0">
                    DSA Progress
                  </h3>

                  <div className="flex p-1 bg-[#252525] rounded-full min-w-0 border border-white/5 shadow-inner">
                    <button
                      onClick={() => handleModeToggle("website")}
                      className={cn(
                        "whitespace-nowrap px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all text-center",
                        dataMode === "website"
                          ? "bg-[#3A2D28] text-[#D0C1B0] shadow-sm border border-white/10"
                          : "text-white/40 hover:text-white/80 border border-transparent",
                      )}
                    >
                      Website
                    </button>
                    <button
                      onClick={() => handleModeToggle("leetcode")}
                      className={cn(
                        "whitespace-nowrap px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all text-center",
                        dataMode === "leetcode"
                          ? "bg-[#3A2D28] text-[#D0C1B0] shadow-sm border border-white/10"
                          : "text-white/40 hover:text-white/80 border border-transparent",
                      )}
                    >
                      LeetCode
                    </button>
                    <button
                      onClick={() => handleModeToggle("codechef")}
                      className={cn(
                        "whitespace-nowrap px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all text-center",
                        dataMode === "codechef"
                          ? "bg-[#3A2D28] text-[#D0C1B0] shadow-sm border border-white/10"
                          : "text-white/40 hover:text-white/80 border border-transparent",
                      )}
                    >
                      CodeChef
                    </button>
                  </div>
                </div>

                {(isLeetcodeLoading && dataMode === "leetcode") ||
                (isCodechefLoading && dataMode === "codechef") ? (
                  <div className="flex-1 flex items-center justify-center relative z-10">
                    <Loader2 className="animate-spin text-white/40 w-8 h-8" />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-10 mt-2 relative z-10">
                    {/* Donut Chart */}
                    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 128 128"
                        className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible"
                      >
                        <defs>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        {dataMode !== "codechef" &&
                          statsSegments.map((segment) => {
                            const isHighlighted = !hoveredDifficulty || hoveredDifficulty === segment.key;
                            return (
                              <g key={segment.key} className={cn("transition-opacity duration-300", isHighlighted ? "opacity-100" : "opacity-30")}>
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="48"
                                  fill="none"
                                  stroke={segment.trackStroke}
                                  strokeLinecap="round"
                                  strokeWidth="6"
                                  strokeDasharray={segment.trackDasharray}
                                  strokeDashoffset={segment.trackDashoffset}
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
                                    strokeDasharray={segment.progressDasharray}
                                    strokeDashoffset={segment.progressDashoffset}
                                    filter={isHighlighted ? "url(#glow)" : "none"}
                                    className="transition-all duration-1000 ease-out"
                                  />
                                )}
                              </g>
                            );
                          })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[28px] font-semibold text-white tracking-tight leading-none mb-1">
                          {currentTotalSolved}
                        </span>
                        {dataMode !== "codechef" && (
                           <>
                             <div className="w-8 h-[1px] bg-white/20 my-1" />
                             <span className="text-[12px] font-medium text-white/50 tracking-wider">
                               {currentTotalQuestions}
                             </span>
                           </>
                        )}
                        {dataMode === "codechef" && (
                          <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest mt-1">
                            Rating
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Inline Row */}
                    {dataMode !== "codechef" && (
                      <div
                        className="flex flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 w-full"
                        onMouseLeave={() => setHoveredDifficulty(null)}
                      >
                        {statsSegments.map((segment) => {
                          const isActive = !hoveredDifficulty || hoveredDifficulty === segment.key;
                          return (
                            <div
                              key={segment.key}
                              onMouseEnter={() => setHoveredDifficulty(segment.key)}
                              className={cn(
                                "flex items-center gap-2 cursor-pointer transition-opacity duration-300",
                                isActive ? "opacity-100" : "opacity-40"
                              )}
                            >
                              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: segment.stroke, color: segment.stroke }} />
                              <span className="text-xs text-white/60 font-medium">
                                {segment.label}
                              </span>
                              <span className="text-xs text-white/90 font-semibold">
                                {segment.value}<span className="text-white/30">/{segment.total}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {dataMode === "codechef" && (
                      <div className="flex flex-row flex-wrap justify-center w-full gap-8 mt-2">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                           <span className="text-xs text-white/60 font-medium">Stars</span>
                           <span className="text-xs text-[#eab308] font-semibold">{codechefData?.stars || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-white/40" />
                           <span className="text-xs text-white/60 font-medium">Global</span>
                           <span className="text-xs text-white/90 font-semibold">{codechefData?.globalRank || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-white/40" />
                           <span className="text-xs text-white/60 font-medium">Country</span>
                           <span className="text-xs text-white/90 font-semibold">{codechefData?.countryRank || "-"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject Progress */}
              <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl flex flex-col relative min-h-[240px]">
                <h3 className="text-sm font-semibold mb-auto">
                  Subject Progress
                </h3>
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/40 mt-4">
                  <div className="w-16 h-12 border-2 border-border rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-border rounded-t-sm" />
                    <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Edit profile to show subject progress
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl flex flex-col relative min-h-[240px]">
                <h3 className="text-sm font-semibold mb-auto">Skills</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/40 mt-4">
                  <div className="w-16 h-12 border-2 border-border rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-border rounded-t-sm" />
                    <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Edit Profile to add skills
                  </p>
                </div>
              </div>
            </div>

            {/* Heatmap Area */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl w-full overflow-hidden">
              <ActivityHeatmap
                websiteCalendar={websiteData?.submissionCalendar || {}}
                leetcodeCalendar={leetcodeData?.submissionCalendar || {}}
                leetcodeActiveYears={leetcodeData?.activeYears || []}
                codechefCalendar={codechefCalendar}
                dataMode={dataMode}
                onModeChange={handleModeToggle}
                isLoading={
                  (isLeetcodeLoading && dataMode === "leetcode") ||
                  (isCodechefLoading && dataMode === "codechef") ||
                  (!websiteData && dataMode === "website")
                }
              />
            </div>

            {/* Bottom Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coding Profiles */}
              <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl flex flex-col min-h-[200px]">
                <h3 className="text-sm font-semibold mb-auto">
                  Coding Profiles
                </h3>
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/40 mt-4">
                  <div className="w-16 h-12 border-2 border-border rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-border rounded-t-sm" />
                    <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Contests */}
              <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border/40 shadow-xl flex flex-col min-h-[200px]">
                <h3 className="text-sm font-semibold mb-auto">Contests</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/40 mt-4">
                  <div className="w-16 h-12 border-2 border-border rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-border rounded-t-sm" />
                    <div className="w-6 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
