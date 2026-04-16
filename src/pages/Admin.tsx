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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} style={{ color: "hsl(var(--primary))" }} />
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "hsl(var(--muted)/0.5)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? "hsl(var(--card))" : "transparent",
              color: tab === t.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: tab === t.id ? "0 1px 3px hsl(var(--foreground)/0.1)" : "none",
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
        </div>
      ) : tab === "users" ? (
        <UsersTab users={users} onDelete={handleDelete} onSetRole={handleSetRole} onBan={handleBan} onUnban={handleUnban} />
      ) : (
        <AnalyticsTab stats={stats} />
      )}
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
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsl(var(--muted)/0.3)" }}>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>User</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Status</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Role</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Joined</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Last Login</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const banned = isBanned(user);
              const isAdminUser = user.roles.includes("admin");
              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-muted/30"
                  style={{ borderTop: "1px solid hsl(var(--border)/0.5)", opacity: banned ? 0.6 : 1 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: banned ? "hsl(var(--destructive)/0.15)" : "hsl(var(--primary)/0.15)", color: banned ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}
                      >
                        {(user.profile?.display_name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                          {user.profile?.display_name || "—"}
                        </div>
                        <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {banned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive)/0.15)", color: "hsl(var(--destructive))" }}>
                        <Ban size={10} /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--success)/0.15)", color: "hsl(var(--success))" }}>
                        <ShieldCheck size={10} /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.roles[0] || "user"}
                      onChange={(e) => onSetRole(user.id, e.target.value)}
                      disabled={isAdminUser}
                      className="text-xs px-2 py-1 rounded-lg outline-none"
                      style={{
                        background: "hsl(var(--muted)/0.5)",
                        color: isAdminUser ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isAdminUser && (
                      <div className="flex items-center justify-end gap-1">
                        {banned ? (
                          <button
                            onClick={() => onUnban(user.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-success/10"
                            style={{ color: "hsl(var(--success))" }}
                            title="Unban user"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onBan(user.id, user.email)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-warning/10"
                            style={{ color: "hsl(var(--accent))" }}
                            title="Ban user"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(user.id, user.email)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-destructive/10"
                          style={{ color: "hsl(var(--destructive))" }}
                          title="Delete user"
                        >
                          <Trash2 size={14} />
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
        <div className="text-center py-12 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          No users found
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "hsl(var(--primary))" },
    { label: "Signups (7d)", value: stats.recentSignups, icon: UserCog, color: "hsl(var(--success))" },
    { label: "Active (7d)", value: stats.recentLogins, icon: BarChart3, color: "hsl(var(--accent))" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-5 rounded-xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: `${card.color}15`, color: card.color }}
            >
              <card.icon size={18} />
            </div>
            <span className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              {card.label}
            </span>
          </div>
          <div className="text-3xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
