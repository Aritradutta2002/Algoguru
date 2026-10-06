import {
  BookOpen,
  Check,
  CloudOff,
  Code2,
  Columns2,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";
import { cn } from "@/lib/utils";

/**
 * Icon strip at the foot of the editor column: draft persistence, focus
 * warnings and the split / problem / editor layout switcher. Deliberately
 * icon-only — every control carries its state in `title` and `sr-only` text.
 */

export type CodingViewMode = "split" | "problem" | "editor";

const SAVE_ICONS = {
  Saved: Check,
  Saving: Loader2,
  Unsaved: CloudOff,
  "Local draft": Check,
} as const;

const SAVE_TONES = {
  Saved: "text-emerald-600 dark:text-emerald-400",
  Saving: "text-muted-foreground",
  Unsaved: "text-amber-600 dark:text-amber-400",
  "Local draft": "text-muted-foreground",
} as const;

const VIEW_OPTIONS: {
  id: CodingViewMode;
  label: string;
  title: string;
  icon: typeof Columns2;
}[] = [
  {
    id: "problem",
    label: "Problem only",
    title: "Show the problem statement on its own",
    icon: BookOpen,
  },
  {
    id: "split",
    label: "Split view",
    title: "Show the problem statement and the editor side by side",
    icon: Columns2,
  },
  {
    id: "editor",
    label: "Editor only",
    title: "Show the editor and console on their own",
    icon: Code2,
  },
];

function IconButton({
  label,
  title,
  pressed,
  onClick,
  className,
  children,
}: {
  label: string;
  title: string;
  pressed?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        pressed
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CodingEditorFooter({
  saveStatus,
  warningCount,
  viewMode,
  onViewModeChange,
}: {
  saveStatus: keyof typeof SAVE_ICONS;
  warningCount: number;
  viewMode: CodingViewMode;
  onViewModeChange: (mode: CodingViewMode) => void;
}) {
  const SaveIcon = SAVE_ICONS[saveStatus] ?? Check;

  return (
    <div className="flex h-9 shrink-0 items-center justify-end gap-1 border-t border-border/60 bg-background px-3">
      <span
        title={`Draft status: ${saveStatus}`}
        className={cn(
          "mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md",
          SAVE_TONES[saveStatus] ?? "text-muted-foreground",
        )}
      >
        <SaveIcon
          aria-hidden="true"
          className={cn("h-3.5 w-3.5", saveStatus === "Saving" && "animate-spin")}
        />
        <span className="sr-only">Draft status: {saveStatus}</span>
      </span>

      {warningCount > 0 ? (
        <span
          title={`Focus warnings: ${warningCount} of ${MAX_EXAM_WARNINGS}`}
          className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive"
        >
          <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">
            Focus warnings: {warningCount} of {MAX_EXAM_WARNINGS}
          </span>
        </span>
      ) : null}

      <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />

      <div role="group" aria-label="Workspace layout" className="flex items-center gap-0.5">
        {VIEW_OPTIONS.map(({ id, label, title, icon: Icon }) => (
          <IconButton
            key={id}
            label={label}
            title={title}
            pressed={viewMode === id}
            onClick={() => onViewModeChange(id)}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          </IconButton>
        ))}
      </div>
    </div>
  );
}
