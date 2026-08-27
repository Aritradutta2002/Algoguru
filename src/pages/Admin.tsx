import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Users, BarChart3, Shield, Trash2, Loader2, UserCog, Ban, ShieldCheck } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";

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
    <div className="flex-1 min-h-screen bg-background text-foreground selection:bg-primary/25">

      <section className="relative border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.10),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-20 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Shield size={12} />
              Admin privileges
            </div>

            <h1 className="text-4xl font-bold leading-[1.04] tracking-[-0.04em] md:text-5xl lg:text-6xl">
              Platform <span className="text-primary">control</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Manage user accounts, monitor platform growth, and oversee roles. This dashboard is for authorized administrators only.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16 lg:px-16 space-y-6">
        <div className="flex p-1 rounded-lg bg-muted border border-border w-full max-w-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary" size={28} />
            <p className="text-xs text-muted-foreground">Fetching records…</p>
          </div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
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
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left px-6 py-3 font-semibold text-xs text-muted-foreground">User identity</th>
              <th className="text-left px-6 py-3 font-semibold text-xs text-muted-foreground">Access status</th>
              <th className="text-left px-6 py-3 font-semibold text-xs text-muted-foreground">Platform role</th>
              <th className="text-left px-6 py-3 font-semibold text-xs text-muted-foreground">Activity</th>
              <th className="text-right px-6 py-3 font-semibold text-xs text-muted-foreground">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const banned = isBanned(user);
              const isAdminUser = user.roles.includes("admin");
              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-muted/30"
                  style={{ opacity: banned ? 0.6 : 1 }}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      {user.profile?.avatar_url ? (
                        <img src={user.profile.avatar_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-border" style={{ aspectRatio: '1/1' }} loading="lazy" />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold border ${banned ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-primary/10 border-primary/20 text-primary"}`}
                        >
                          {(user.profile?.display_name?.[0] || user.email[0]).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {user.profile?.display_name || "Guest learner"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {banned ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive">
                        <Ban size={11} /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md bg-success/10 border border-success/30 text-success">
                        <ShieldCheck size={11} /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <select
                      value={user.roles[0] || "user"}
                      onChange={(e) => onSetRole(user.id, e.target.value)}
                      disabled={isAdminUser}
                      className="text-xs px-2 py-1 rounded-md outline-none cursor-pointer bg-muted/40 border border-border hover:border-primary/40 focus:border-primary disabled:opacity-40"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <div>Joined {new Date(user.created_at).toLocaleDateString()}</div>
                      <div>Last {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {!isAdminUser && (
                      <div className="flex items-center justify-end gap-1.5">
                        {banned ? (
                          <AppTooltip content="Unban user">
                            <button
                              onClick={() => onUnban(user.id)}
                              className="p-2 rounded-md transition-colors bg-success/10 text-success hover:bg-success/20 border border-success/20"
                              aria-label="Unban user"
                            >
                              <ShieldCheck size={15} />
                            </button>
                          </AppTooltip>
                        ) : (
                          <AppTooltip content="Ban user">
                            <button
                              onClick={() => onBan(user.id, user.email)}
                              className="p-2 rounded-md transition-colors bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20"
                              aria-label="Ban user"
                            >
                              <Ban size={15} />
                            </button>
                          </AppTooltip>
                        )}
                        <AppTooltip content="Delete user">
                          <button
                            onClick={() => onDelete(user.id, user.email)}
                            className="p-2 rounded-md transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                            aria-label="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </AppTooltip>
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
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/50">
            <Users size={24} />
          </div>
          <p className="text-xs text-muted-foreground">No records discovered</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative rounded-2xl bg-card border border-border p-6 transition-colors hover:bg-muted/30"
        >
          <div className="space-y-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border"
              style={{ background: `${card.color}10`, borderColor: `${card.color}25`, color: card.color }}
            >
              <card.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {card.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-0.5">
                {card.label}
              </div>
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                {card.desc}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
