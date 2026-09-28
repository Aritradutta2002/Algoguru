/**
 * Confirmation dialog for destructive progress resets.
 *
 * Shared by the Java Interview Hub (Supabase-backed Core Java marks) and the
 * Spring Boot hub (localStorage marks). Built on Radix AlertDialog: focus lands
 * on the safe action first, Escape cancels, focus is trapped and restored to the
 * trigger afterwards.
 */
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ResetProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  /** Short sentence stating what the reset does. */
  description: string;
  /** Exactly what gets deleted, one entry per line. */
  impactLines: string[];
  /** Whether the deletion can be undone, and what survives it. */
  reversibility: string;
  confirmLabel?: string;
}

export function ResetProgressDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  impactLines,
  reversibility,
  confirmLabel = "Reset progress",
}: ResetProgressDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="cjh-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <ul className="cjh-dialog-list">
            {impactLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="cjh-dialog-note">{reversibility}</p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
