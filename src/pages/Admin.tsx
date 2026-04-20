import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Users, BarChart3, Shield, Trash2, Loader2, UserCog, Ban, ShieldCheck } from "lucide-react";

interface UserEntry {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  profile: { display_name: string | null; avatar_url: string | null } | null;
  roles: string[];
}

interface Stats {
  totalUsers: number;
  recentSignups: number;
  recentLogins: number;
}

function adminApi(action: string, params: Record<string, unknown> = {}) {
  return supabase.functions.invoke("admin-api", {
    body: { action, ...params },
  });
}

function isBanned(user: UserEntry) {
  if (!user.banned_until) return false;
  return new Date(user.banned_until) > new Date();
}

export default function Admin() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"users" | "analytics">("users");
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin, tab]);

  const loadData = async () => {
    setLoading(true);
    if (tab === "users") {
      const { data, error } = await adminApi("list_users");
      if (error) toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      else setUsers(data?.users || []);
    } else {
      const { data, error } = await adminApi("stats");
      if (error) toast({ title: "Error", description: "Failed to load stats", variant: "destructive" });
      else setStats(data as Stats);
    }
    setLoading(false);
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const { error } = await adminApi("delete_user", { userId });
    if (error) toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    else {
      toast({ title: "User deleted" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const handleBan = async (userId: string, email: string) => {
    if (!confirm(`Ban user ${email}? They will be unable to log in.`)) return;
    const { error } = await adminApi("ban_user", { userId, permanent: true });
    if (error) toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    else {
      toast({ title: "User banned" });
      loadData();
    }
  };

  const handleUnban = async (userId: string) => {
    const { error } = await adminApi("unban_user", { userId });
    if (error) toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
    else {
      toast({ title: "User unbanned" });
      loadData();
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    const { error } = await adminApi("set_role", { userId, role });
    if (error) toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    else {
      toast({ title: "Role updated" });
      loadData();
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={24} style={{ color: "hsl(var(--muted-foreground))" }} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "users" as const, label: "Users", icon: Users },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary selection:text-black animate-in fade-in duration-700">
      
      {/* Header Section */}
      <section className="px-4 md:px-10 lg:px-16 py-12 md:py-20 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center md:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-primary/10 border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary mb-6">
              <Shield size={12} />
              <span>Admin Privileges</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">
              Platform <span className="text-primary">Control</span>
            </h1>
            
            <p className="text-base md:text-lg font-medium text-muted-foreground max-w-2xl leading-relaxed mx-auto md:mx-0">
              Manage user accounts, monitor platform growth, and oversee roles. This dashboard is for authorized administrators only.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 md:px-12 lg:px-20 pb-18 lg:pb-24 max-w-7xl mx-auto w-full space-y-6 lg:space-y-8">
        {/* Tabs Bar */}
        <div className="flex p-1.5 rounded-[24px] bg-muted/30 border border-border/30 w-full max-w-md">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                tab === t.id 
                  ? "bg-card border border-border/50 text-foreground shadow-xl shadow-black/10" 
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Fetching records...</p>
          </div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "users" ? (
              <UsersTab users={users} onDelete={handleDelete} onSetRole={handleSetRole} onBan={handleBan} onUnban={handleUnban} />
            ) : (
              <AnalyticsTab stats={stats} />
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function UsersTab({
  users,
  onDelete,
  onSetRole,
  onBan,
  onUnban,
}: {
  users: UserEntry[];
  onDelete: (id: string, email: string) => void;
  onSetRole: (id: string, role: string) => void;
  onBan: (id: string, email: string) => void;
  onUnban: (id: string) => void;
}) {
  return (
    <div className="rounded-[32px] overflow-hidden border border-border/50 bg-card shadow-2xl shadow-primary/5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border/30">
              <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">User Identity</th>
              <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Access Status</th>
              <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Platform Role</th>
              <th className="text-left px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Activity</th>
              <th className="text-right px-8 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {users.map((user) => {
              const banned = isBanned(user);
              const isAdminUser = user.roles.includes("admin");
              return (
                <tr
                  key={user.id}
                  className="transition-all hover:bg-muted/20 group"
                  style={{ opacity: banned ? 0.6 : 1 }}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`absolute inset-0 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${banned ? "bg-destructive/20" : "bg-primary/20"}`} />
                        {user.profile?.avatar_url ? (
                          <img src={user.profile.avatar_url} alt="" className="relative w-10 h-10 rounded-xl object-cover border border-border/50 shadow-sm max-w-full" style={{ aspectRatio: '1/1' }} loading="lazy" />
                        ) : (
                          <div
                            className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black border transition-all ${banned ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/10 border-primary/20 text-primary"}`}
                          >
                            {(user.profile?.display_name?.[0] || user.email[0]).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground tracking-tight truncate">
                          {user.profile?.display_name || "Guest Learner"}
                        </div>
                        <div className="text-[10px] font-medium text-muted-foreground/50 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {banned ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive shadow-sm shadow-destructive/5">
                        <Ban size={10} /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success shadow-sm shadow-success/5">
                        <ShieldCheck size={10} /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <select
                      value={user.roles[0] || "user"}
                      onChange={(e) => onSetRole(user.id, e.target.value)}
                      disabled={isAdminUser}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none transition-all cursor-pointer bg-muted/30 border border-border/30 hover:border-primary/30 focus:border-primary/50 disabled:opacity-40"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground/40 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/10" />
                        Last {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {!isAdminUser && (
                      <div className="flex items-center justify-end gap-2">
                        {banned ? (
                          <button
                            onClick={() => onUnban(user.id)}
                            className="p-2.5 rounded-xl transition-all bg-success/5 text-success hover:bg-success/20 border border-success/10"
                            title="Unban user"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onBan(user.id, user.email)}
                            className="p-2.5 rounded-xl transition-all bg-warning/5 text-warning hover:bg-warning/20 border border-warning/10"
                            title="Ban user"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(user.id, user.email)}
                          className="p-2.5 rounded-xl transition-all bg-destructive/5 text-destructive hover:bg-destructive/20 border border-destructive/10"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-[24px] bg-muted/20 flex items-center justify-center text-muted-foreground/20">
            <Users size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No records discovered</p>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const cards = [
    { label: "Total Platform Users", value: stats.totalUsers, icon: Users, color: "hsl(var(--primary))", desc: "Lifetime account creations" },
    { label: "Weekly Growth", value: stats.recentSignups, icon: UserCog, color: "hsl(var(--success))", desc: "New learners in last 7 days" },
    { label: "Platform Activity", value: stats.recentLogins, icon: BarChart3, color: "hsl(var(--accent))", desc: "Unique logins in last 7 days" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative p-8 rounded-[32px] bg-card border border-border/50 overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5"
        >
          <div 
            className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity"
            style={{ background: card.color }}
          />

          <div className="relative z-10 space-y-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all"
              style={{ background: `${card.color}10`, borderColor: `${card.color}20`, color: card.color }}
            >
              <card.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter text-foreground mb-1">
                {card.value}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {card.label}
              </div>
              <p className="text-[9px] font-bold text-muted-foreground/40 mt-3 border-t border-border/10 pt-3">
                {card.desc}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
