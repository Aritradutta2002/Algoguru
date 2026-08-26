import { Bot } from "lucide-react";
import {
  GURU_SELECTION_ACTIONS,
  type GuruSelectionAction,
} from "@/lib/playground/guruPrompts";

export function GuruSelectionMenu({
  top,
  left,
  onAction,
  onDismiss,
}: {
  top: number;
  left: number;
  onAction: (action: GuruSelectionAction) => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="menu"
      aria-label="GuruBot selection actions"
      className="lc-surface pg-guru-menu fixed z-[70] w-[168px] overflow-hidden rounded-lg py-1 shadow-xl"
      style={{ top, left }}
    >
      <div
        className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--lc-muted)" }}
      >
        <Bot size={11} />
        GuruBot
      </div>
      {GURU_SELECTION_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAction(action.id)}
          className="flex w-full px-2.5 py-1.5 text-left text-[12px] font-medium lc-hover"
          style={{ color: "var(--lc-text)" }}
        >
          {action.label}
        </button>
      ))}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDismiss}
        className="flex w-full px-2.5 py-1.5 text-left text-[11px]"
        style={{ color: "var(--lc-faint)" }}
      >
        Dismiss
      </button>
    </div>
  );
}
