import { useState } from "react";
import { Bell, Check, CheckCheck, Sparkles, Trophy, BookOpen, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "ai" | "contest" | "interview" | "roadmap";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Guru AI Coach",
    description: "Your Dynamic Programming solution was analyzed with 98% space efficiency.",
    time: "15m ago",
    read: false,
    type: "ai",
  },
  {
    id: "notif-2",
    title: "New System Design Track",
    description: "Distributed Rate Limiter case study & architecture diagrams are now available.",
    time: "2h ago",
    read: false,
    type: "interview",
  },
  {
    id: "notif-3",
    title: "Weekly Engineering Contest",
    description: "Registration open for Spring Algorithmic Challenge. Starts Saturday 10:00 AM UTC.",
    time: "1d ago",
    read: true,
    type: "contest",
  },
];

const TYPE_ICONS = {
  ai: Sparkles,
  contest: Trophy,
  interview: Layers,
  roadmap: BookOpen,
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const displayedNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <DropdownMenu>
      <AppTooltip content={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
            className={cn(
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "border border-border/60 bg-muted/30 text-muted-foreground",
              "transition-all duration-200 ease-out",
              "hover:border-border hover:bg-muted/70 hover:text-foreground",
              "active:scale-95 touch-manipulation outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1"
            )}
          >
            <Bell size={17} className="transition-transform duration-200 group-hover:scale-105" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
      </AppTooltip>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Tab filters */}
        <div className="flex items-center gap-1 px-3 pb-2 pt-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              filter === "all"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              filter === "unread"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        {/* List of items */}
        <div className="max-h-80 overflow-y-auto space-y-1 p-1">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check size={24} className="text-muted-foreground/60 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                All caught up! No unread notifications.
              </p>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const Icon = TYPE_ICONS[item.type] || Bell;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  onSelect={(e) => {
                    e.preventDefault();
                    markAsRead(item.id);
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors",
                    item.read
                      ? "opacity-75 hover:opacity-100 hover:bg-muted/50"
                      : "bg-muted/30 hover:bg-muted/60"
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/60 text-muted-foreground mt-0.5">
                    <Icon size={14} className={item.type === "ai" ? "text-primary" : undefined} />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12.5px] font-medium text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  {!item.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 self-center" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
