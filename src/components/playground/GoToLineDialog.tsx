import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function GoToLineDialog({
  open,
  onOpenChange,
  maxLine,
  onGo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxLine: number;
  onGo: (line: number) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lc-surface max-w-sm rounded-xl" style={{ color: "var(--lc-text)" }}>
        <DialogHeader>
          <DialogTitle className="text-sm">Go to line</DialogTitle>
          <DialogDescription className="text-[12px]" style={{ color: "var(--lc-muted)" }}>
            Enter a line between 1 and {Math.max(1, maxLine)}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const line = Number(value);
            if (!Number.isInteger(line) || line < 1) return;
            onGo(Math.min(line, Math.max(1, maxLine)));
            onOpenChange(false);
          }}
        >
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            aria-label="Line number"
            className="lc-field h-10 px-3 font-mono text-sm"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
