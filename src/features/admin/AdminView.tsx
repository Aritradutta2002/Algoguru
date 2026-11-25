"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Users, BarChart3, Shield, Trash2, Loader2, UserCog, Ban, ShieldCheck } from "lucide-react";
import { AppTooltip } from "@/components/ui/tooltip";
import { BrandLoader } from "@/components/brand/BrandLoader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type PendingAdminAction =
  | { type: "delete"; userId: string; email: string }
  | { type: "ban"; userId: string; email: string };

function adminApi(action: string, params: Record<string, unknown> = {}) {
  return supabase.functions.invoke("admin-api", {
    body: { action, ...params },
  });
}

function isBanned(user: UserEntry) {
  if (!user.banned_until) return false;
  return new Date(user.banned_until) > new Date();
}

export function AdminView() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "analytics">("users");
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, roleLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (tab === "users") {
      const { data, error } = await adminApi("list_users");
      if (error) {
        toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      } else {
        setUsers(data?.users || []);
      }
    } else {
      const { data, error } = await adminApi("stats");
      if (error) {
        toast({ title: "Error", description: "Failed to load stats", variant: "destructive" });
      } else {
        setStats(data as Stats);
      }
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin, loadData]);

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    setActionSubmitting(true);

    if (pendingAction.type === "delete") {
      const { error } = await adminApi("delete_user", { userId: pendingAction.userId });
      if (error) {
        toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
      } else {
        toast({ title: "User deleted" });
        setUsers((prev) => prev.filter((u) => u.id !== pendingAction.userId));
        setPendingAction(null);
      }
    } else {
      const { error } = await adminApi("ban_user", {
        userId: pendingAction.userId,
        permanent: true,
      });
      if (error) {
        toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
      } else {
        toast({ title: "User banned" });
        setPendingAction(null);
        await loadData();
      }
    }

    setActionSubmitting(false);
  };

  const handleUnban = async (userId: string) => {
    const { error } = await adminApi("unban_user", { userId });
    if (error) {
      toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
    } else {
      toast({ title: "User unbanned" });
      loadData();
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    const { error } = await adminApi("set_role", { userId, role });
    if (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      loadData();
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BrandLoader variant="screen" size="md" label="Loading admin console…" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 min-h-screen bg-obsidian-void text-foreground">
      <section className="relative border-b border-obsidian-border bg-obsidian-void">
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="lp-kicker mb-3">
              <Shield size={12} className="inline mr-1" /> Admin privileges
            </p>

            <h1 className="text-3xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-4xl md:text-5xl text-foreground">
              Platform control
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              Manage user accounts, monitor platform growth, and oversee roles. This dashboard is
              for authorized administrators only.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 md:py-10 space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "users" | "analytics")}>
          <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-lg border border-obsidian-border bg-obsidian-pane p-1">
            <TabsTrigger
              value="users"
              className="gap-2 h-8 text-xs font-medium data-[state=active]:bg-obsidian-elevated data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Users size={14} />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-2 h-8 text-xs font-medium data-[state=active]:bg-obsidian-elevated data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <BarChart3 size={14} />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BrandLoader variant="screen" size="sm" label="Fetching records…" />
            </div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              <TabsContent value="users" className="mt-0">
                <UsersTab
                  users={users}
                  onRequestDelete={(id, email) => setPendingAction({ type: "delete", userId: id, email })}
                  onSetRole={handleSetRole}
                  onRequestBan={(id, email) => setPendingAction({ type: "ban", userId: id, email })}
                  onUnban={handleUnban}
                />
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                <AnalyticsTab stats={stats} />
              </TabsContent>
            </motion.div>
          )}
        </Tabs>
      </section>

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !actionSubmitting) setPendingAction(null);
        }}
      >
        <AlertDialogContent className="border-obsidian-border bg-obsidian-pane">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "delete" ? "Delete user account?" : "Ban user account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "delete"
                ? `Delete user ${pendingAction.email}? This action cannot be undone.`
                : pendingAction
                  ? `Ban user ${pendingAction.email}? They will be unable to log in.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmPendingAction();
              }}
              disabled={actionSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionSubmitting && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {pendingAction?.type === "delete" ? "Delete user" : "Ban user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UsersTab({
  users,
  onRequestDelete,
  onSetRole,
  onRequestBan,
  onUnban,
}: {
  users: UserEntry[];
  onRequestDelete: (id: string, email: string) => void;
  onSetRole: (id: string, role: string) => void;
  onRequestBan: (id: string, email: string) => void;
  onUnban: (id: string) => void;
}) {
  return (
    <Card className="rounded-[0.875rem] overflow-hidden border-obsidian-border bg-obsidian-pane shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="bg-obsidian-elevated border-obsidian-border hover:bg-obsidian-elevated">
            <TableHead className="px-5 py-3 text-xs font-medium text-muted-foreground">
              User identity
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-muted-foreground">
              Access status
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-muted-foreground">
              Platform role
            </TableHead>
            <TableHead className="px-5 py-3 text-xs font-medium text-muted-foreground">
              Activity
            </TableHead>
            <TableHead className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
              Operations
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-obsidian-border">
          {users.map((user) => {
            const banned = isBanned(user);
            const isAdminUser = user.roles.includes("admin");
            const initial = (user.profile?.display_name?.[0] || user.email[0] || "?").toUpperCase();
            return (
              <TableRow
                key={user.id}
                className="border-obsidian-border transition-colors hover:bg-obsidian-elevated/40"
                style={{ opacity: banned ? 0.6 : 1 }}
              >
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-md border border-obsidian-border">
                      <AvatarImage src={user.profile?.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="rounded-md bg-obsidian-elevated text-xs font-semibold text-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-xs truncate">
                        {user.profile?.display_name || "Guest learner"}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  {banned ? (
                    <Badge
                      variant="destructive"
                      className="gap-1.5 border border-destructive/30 bg-destructive/10 text-destructive"
                    >
                      <Ban size={11} /> Banned
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    >
                      <ShieldCheck size={11} /> Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Select
                    value={user.roles[0] || "user"}
                    onValueChange={(value) => onSetRole(user.id, value)}
                    disabled={isAdminUser}
                  >
                    <SelectTrigger className="h-8 w-32 border-obsidian-border bg-obsidian-elevated px-2.5 py-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" className="text-xs">
                        User
                      </SelectItem>
                      <SelectItem value="moderator" className="text-xs">
                        Moderator
                      </SelectItem>
                      <SelectItem value="admin" className="text-xs">
                        Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div>Joined {new Date(user.created_at).toLocaleDateString()}</div>
                    <div>
                      Last{" "}
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  {!isAdminUser && (
                    <div className="flex items-center justify-end gap-1.5">
                      {banned ? (
                        <AppTooltip content="Unban user">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onUnban(user.id)}
                            className="h-8 w-8 border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated text-emerald-400 hover:text-emerald-300"
                            aria-label="Unban user"
                          >
                            <ShieldCheck size={14} />
                          </Button>
                        </AppTooltip>
                      ) : (
                        <AppTooltip content="Ban user">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onRequestBan(user.id, user.email)}
                            className="h-8 w-8 border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated text-warning hover:text-warning"
                            aria-label="Ban user"
                          >
                            <Ban size={14} />
                          </Button>
                        </AppTooltip>
                      )}
                      <AppTooltip content="Delete user">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => onRequestDelete(user.id, user.email)}
                          className="h-8 w-8 border-obsidian-border bg-obsidian-pane hover:bg-obsidian-elevated text-destructive hover:text-destructive"
                          aria-label="Delete user"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AppTooltip>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-10 h-10 rounded-lg bg-obsidian-elevated border border-obsidian-border flex items-center justify-center text-muted-foreground">
            <Users size={20} />
          </div>
          <p className="text-xs text-muted-foreground">No records discovered</p>
        </div>
      )}
    </Card>
  );
}

function AnalyticsTab({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Platform Users",
      value: stats.totalUsers,
      icon: Users,
      desc: "Lifetime account creations",
    },
    {
      label: "Weekly Growth",
      value: stats.recentSignups,
      icon: UserCog,
      desc: "New learners in last 7 days",
    },
    {
      label: "Platform Activity",
      value: stats.recentLogins,
      icon: BarChart3,
      desc: "Unique logins in last 7 days",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="relative rounded-[0.875rem] bg-obsidian-pane border-obsidian-border p-5 shadow-none transition-colors hover:bg-obsidian-elevated"
        >
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-obsidian-border bg-obsidian-elevated text-muted-foreground">
              <card.icon size={18} />
            </div>
            <div>
              <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {card.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</div>
              <p className="text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-obsidian-border">
                {card.desc}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default AdminView;
