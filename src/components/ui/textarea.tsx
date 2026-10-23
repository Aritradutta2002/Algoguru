import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full rounded-lg border border-border bg-card/70 px-3 py-2.5 text-sm leading-6 ring-offset-background shadow-[inset_0_1px_0_hsl(var(--foreground)/0.025)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
