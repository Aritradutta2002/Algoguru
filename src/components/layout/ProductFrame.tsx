import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProductFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function ProductFrame({
  title,
  badge,
  children,
  className,
  ...props
}: ProductFrameProps) {
  return (
    <div className={cn("lp-frame", className)} {...props}>
      {(title != null || badge != null) && (
        <div className="lp-frame-bar">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="lp-dot" />
            <span className="lp-dot" />
            <span className="lp-dot" />
          </div>
          {title != null && (
            <div className="ml-2 min-w-0 truncate text-[12.5px] text-muted-foreground">
              {title}
            </div>
          )}
          {badge != null && (
            <span className="lp-chip ml-auto hidden shrink-0 sm:inline-flex">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
