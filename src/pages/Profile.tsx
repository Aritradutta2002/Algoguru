import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Camera, Save, Loader2, User, Github, Linkedin, Globe, Briefcase, FileText, CheckCircle2, Edit2, Share2, MapPin, GraduationCap } from "lucide-react";
import { practiceContentMap } from "@/data/practiceContent";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";

export default function Profile() {
  const { user, profile, resolvedAvatar, refreshProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  
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
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        display_name: displayName,
        bio: bio,
        role_title: roleTitle,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        website: website
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Profile saved!" });
      setIsEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#111111] text-foreground p-4 lg:p-8 flex flex-col lg:flex-row gap-6 pb-20 animate-in fade-in duration-700">
      
      {/* Left Sidebar (Profile Info) */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col">
          {/* Avatar & Name */}
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
                  {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center border-2 border-background shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50 z-10"
                >
                  {uploading ? <Loader2 className="animate-spin w-3 h-3" /> : <Camera className="w-3 h-3" />}
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
              <h1 className="text-lg font-bold leading-tight">{displayName || "Add your name"}</h1>
              <p className="text-xs text-primary/80 font-medium">{user?.email?.split('@')[0] || "username"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs font-semibold"
            >
              <Edit2 size={14} />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-xs font-semibold">
              <Share2 size={14} />
              Share
            </button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 text-xs font-medium text-white/70">
            <h3 className="text-sm font-bold text-white mb-2">Basic Information</h3>
            {roleTitle && (
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-white/40" />
                <span>{roleTitle}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <GraduationCap size={16} className="text-white/40" />
              <span>Academy of Technology</span>
            </div>
            {website && (
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-white/40" />
                <a href={website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                  {website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {githubUrl && (
              <div className="flex items-center gap-3">
                <Github size={16} className="text-white/40" />
                <a href={githubUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                  {githubUrl.split('/').pop() || "GitHub"}
                </a>
              </div>
            )}
            {linkedinUrl && (
              <div className="flex items-center gap-3">
                <Linkedin size={16} className="text-white/40" />
                <a href={linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                  {linkedinUrl.split('/in/').pop() || "LinkedIn"}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {isEditing ? (
          <div className="bg-[#1C1C1C] rounded-2xl p-6 md:p-10 border border-white/5 shadow-2xl space-y-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Role / Title</label>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">About Me (Bio)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 min-h-[100px] rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all resize-y"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">GitHub</label>
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">LinkedIn</label>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Website</label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-medium outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* DSA Progress */}
              <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col relative min-h-[240px]">
                <div className="flex justify-between items-center w-full mb-8">
                  <h3 className="text-sm font-semibold">DSA Progress</h3>
                </div>

                {statsLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/20" />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-4">
                    {/* Circle Chart */}
                    <div className="relative w-28 h-28 shrink-0">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        {/* Background Rings */}
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#2A2A2A" strokeWidth="6" />
                        
                        {/* Fake Easy/Med/Hard Segments (Visual representation for LeetCode style) */}
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#22c55e" strokeWidth="6" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * 0.1)} className="transition-all duration-1000" />
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#eab308" strokeWidth="6" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * 0.4)} strokeDasharray="301.59" className="transition-all duration-1000 -rotate-[36deg] origin-center" />
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * 0.2)} strokeDasharray="301.59" className="transition-all duration-1000 rotate-[108deg] origin-center" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">{dsaCompletedCount}</span>
                        <span className="text-[10px] font-medium text-white/40">{totalDsaProblems}</span>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex-1 space-y-3 pl-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                          <span className="text-white/60">Easy</span>
                        </div>
                        <span className="font-semibold text-white/90">{easyCount}<span className="text-white/30 ml-1">/{totalEasy}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                          <span className="text-white/60">Medium</span>
                        </div>
                        <span className="font-semibold text-white/90">{mediumCount}<span className="text-white/30 ml-1">/{totalMedium}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                          <span className="text-white/60">Hard</span>
                        </div>
                        <span className="font-semibold text-white/90">{hardCount}<span className="text-white/30 ml-1">/{totalHard}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Progress */}
              <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col relative min-h-[240px]">
                <h3 className="text-sm font-semibold mb-auto">Subject Progress</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-white/20 mt-4">
                  <div className="w-16 h-12 border-2 border-white/20 rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-sm" />
                    <div className="w-6 h-1 bg-white/20 rounded-full" />
                  </div>
                  <p className="text-xs text-white/40">Edit profile to show subject progress</p>
                </div>
              </div>

              {/* Skills */}
              <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col relative min-h-[240px]">
                <h3 className="text-sm font-semibold mb-auto">Skills</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-white/20 mt-4">
                  <div className="w-16 h-12 border-2 border-white/20 rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-sm" />
                    <div className="w-6 h-1 bg-white/20 rounded-full" />
                  </div>
                  <p className="text-xs text-white/40">Edit Profile to add skills</p>
                </div>
              </div>
            </div>

            {/* Heatmap Area */}
            <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl w-full overflow-hidden">
              {statsLoading ? (
                <div className="flex items-center justify-center h-48 w-full">
                  <Loader2 className="animate-spin text-white/20" />
                </div>
              ) : (
                <ActivityHeatmap completedDates={completedDates} />
              )}
            </div>

            {/* Bottom Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coding Profiles */}
              <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col min-h-[200px]">
                <h3 className="text-sm font-semibold mb-auto">Coding Profiles</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-white/20 mt-4">
                  <div className="w-16 h-12 border-2 border-white/20 rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-sm" />
                    <div className="w-6 h-1 bg-white/20 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Contests */}
              <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-white/5 shadow-2xl flex flex-col min-h-[200px]">
                <h3 className="text-sm font-semibold mb-auto">Contests</h3>
                <div className="flex flex-col items-center justify-center flex-1 text-white/20 mt-4">
                  <div className="w-16 h-12 border-2 border-white/20 rounded-lg flex items-center justify-center mb-4 relative">
                    <div className="absolute -top-3 w-4 h-2 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-sm" />
                    <div className="w-6 h-1 bg-white/20 rounded-full" />
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
