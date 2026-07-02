import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Save, Loader2, User, Github, Linkedin, Globe, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { practiceContentMap } from "@/data/practiceContent";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";

export default function Profile() {
  const { user, profile, resolvedAvatar, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [website, setWebsite] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress & Activity State
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [dsaCompletedCount, setDsaCompletedCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Difficulty Breakdown State
  const [easyCount, setEasyCount] = useState(0);
  const [mediumCount, setMediumCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);

  const { totalDsaProblems, totalEasy, totalMedium, totalHard, problemDifficultyMap } = useMemo(() => {
    const allProblems = Object.values(practiceContentMap).flat().filter(s => !/^(Easy|Medium|Hard) Problems$/i.test(s.title));
    
    let tEasy = 0;
    let tMedium = 0;
    let tHard = 0;
    const diffMap = new Map<string, string>();
    
    allProblems.forEach(p => {
      diffMap.set(p.id, p.difficulty);
      if (p.difficulty === "Easy") tEasy++;
      else if (p.difficulty === "Medium") tMedium++;
      else if (p.difficulty === "Hard") tHard++;
    });
    
    return { 
      totalDsaProblems: allProblems.length, 
      totalEasy: tEasy, 
      totalMedium: tMedium, 
      totalHard: tHard, 
      problemDifficultyMap: diffMap 
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      try {
        const { data: practiceData } = await supabase
          .from("practice_problem_user_state")
          .select("problem_id, updated_at")
          .eq("user_id", user.id)
          .eq("is_completed", true);
          
        const { data: javaData } = await supabase
          .from("core_java_user_state")
          .select("question_id, updated_at")
          .eq("user_id", user.id)
          .eq("is_completed", true);
          
        const pData = practiceData || [];
        const jData = javaData || [];
        
        setDsaCompletedCount(pData.length);
        
        let cEasy = 0;
        let cMedium = 0;
        let cHard = 0;
        
        pData.forEach(item => {
          const diff = problemDifficultyMap.get(item.problem_id);
          if (diff === "Easy") cEasy++;
          else if (diff === "Medium") cMedium++;
          else if (diff === "Hard") cHard++;
        });
        
        setEasyCount(cEasy);
        setMediumCount(cMedium);
        setHardCount(cHard);
        
        const allDates = [...pData, ...jData].map(item => item.updated_at);
        setCompletedDates(allDates);
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [user, problemDifficultyMap]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setRoleTitle(profile.role_title || "");
      setGithubUrl(profile.github_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setWebsite(profile.website || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
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
    
    // We update the table. Note: If the columns don't exist yet, this will fail.
    // The user needs to run the SQL migration.
    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        bio: bio,
        role_title: roleTitle,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        website: website
      } as any) // Type asserted as any to prevent TS errors before types are regenerated
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile saved!" });
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <section className="px-4 md:px-10 lg:px-16 py-12 md:py-20 max-w-5xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Avatar Area */}
          <div className="group relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt="Avatar"
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-[40px] object-cover border-4 border-background shadow-2xl transition-transform duration-500 group-hover:scale-105"
                style={{ aspectRatio: '1/1' }}
              />
            ) : (
              <div
                className="relative w-32 h-32 md:w-40 md:h-40 rounded-[40px] flex items-center justify-center text-5xl font-black border-4 border-background bg-primary/10 text-primary shadow-2xl"
              >
                {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-foreground text-background flex items-center justify-center border-4 border-background shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50 z-10 cursor-pointer"
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-[10px] font-bold uppercase tracking-widest mb-4">
              <User size={12} className="text-primary" />
              <span className="text-muted-foreground">My Profile</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2">
              {displayName || "Add your name"}
            </h1>
            <p className="text-base md:text-xl font-medium text-muted-foreground mb-4 max-w-xl">
              {roleTitle || "Update your profile to stand out"}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-10 lg:px-16 max-w-5xl mx-auto w-full relative z-20 space-y-8">
        
        {/* LeetCode-style Progress & Activity Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
          
          {/* DSA Progress Circular / Bars Stats */}
          <div className="bg-card border rounded-[24px] p-6 shadow-xl shadow-primary/5 flex flex-col items-center">
            <h3 className="text-sm font-black uppercase tracking-widest self-start mb-6 text-foreground/80">Solved Problems</h3>
            
            {statsLoading ? (
              <div className="flex items-center justify-center h-48 w-full">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : (
              <>
                <div className="relative w-40 h-40 flex flex-col items-center justify-center mb-8">
                  {/* Outer Circle (Background) */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="72" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" className="opacity-30" />
                    {/* Progress Arc */}
                    <circle 
                      cx="80" cy="80" r="72" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" 
                      strokeDasharray="452.38" 
                      strokeDashoffset={452.38 - (452.38 * (totalDsaProblems > 0 ? dsaCompletedCount / totalDsaProblems : 0))}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="text-center z-10 flex flex-col items-center">
                    <span className="text-4xl font-black tracking-tighter text-foreground">{dsaCompletedCount}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Solved</span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  {/* Easy */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-bold text-success/80">Easy</span>
                      <span className="font-bold text-foreground">
                        {easyCount} <span className="text-muted-foreground">/ {totalEasy}</span>
                      </span>
                    </div>
                    <div className="w-full bg-success/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-success h-full rounded-full transition-all duration-1000" style={{ width: `${totalEasy > 0 ? (easyCount / totalEasy) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-bold text-warning/80">Medium</span>
                      <span className="font-bold text-foreground">
                        {mediumCount} <span className="text-muted-foreground">/ {totalMedium}</span>
                      </span>
                    </div>
                    <div className="w-full bg-warning/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-warning h-full rounded-full transition-all duration-1000" style={{ width: `${totalMedium > 0 ? (mediumCount / totalMedium) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end text-xs">
                      <span className="font-bold text-destructive/80">Hard</span>
                      <span className="font-bold text-foreground">
                        {hardCount} <span className="text-muted-foreground">/ {totalHard}</span>
                      </span>
                    </div>
                    <div className="w-full bg-destructive/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-destructive h-full rounded-full transition-all duration-1000" style={{ width: `${totalHard > 0 ? (hardCount / totalHard) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Heatmap Area */}
          <div className="bg-card border rounded-[24px] p-6 shadow-xl shadow-primary/5 flex flex-col h-full">
            {statsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : (
              <ActivityHeatmap completedDates={completedDates} />
            )}
          </div>
        </div>

        {/* Profile Settings Card */}
        <div className="bg-card border rounded-[24px] p-6 md:p-10 shadow-xl shadow-primary/5 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                <User size={14} className="text-primary" />
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
              />
            </div>

            {/* Role Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                <Briefcase size={14} className="text-primary" />
                Role / Title
              </label>
              <input
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Frontend Developer"
                className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
              <FileText size={14} className="text-primary" />
              About Me (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little bit about yourself, your skills, and what you're learning..."
              className="w-full px-5 py-4 min-h-[120px] rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30 resize-y"
            />
          </div>

          {/* Social Links */}
          <div className="pt-6 border-t border-border/50">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              Social Links
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  <Github size={14} className="text-primary" />
                  GitHub URL
                </label>
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  <Linkedin size={14} className="text-primary" />
                  LinkedIn URL
                </label>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  <Globe size={14} className="text-primary" />
                  Website
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="w-full px-5 py-4 rounded-[20px] bg-muted/20 border border-border/50 text-sm font-bold text-foreground outline-none transition-all focus:border-primary/50 focus:bg-muted/30 focus:ring-4 focus:ring-primary/5 placeholder:text-muted-foreground/30"
                />
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[11px] font-bold text-muted-foreground/70 tracking-wide">
              Logged in as: <span className="text-foreground">{user?.email}</span>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-3 w-full md:w-auto px-10 py-4 rounded-[20px] text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Profile
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}
