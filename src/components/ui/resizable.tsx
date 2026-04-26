import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelGroup>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelGroup>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.PanelGroup
    ref={ref}
    className={cn("flex h-full w-full min-h-0 min-w-0 overflow-hidden data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
));
ResizablePanelGroup.displayName = ResizablePrimitive.PanelGroup.displayName;

const ResizablePanel = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.Panel>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.Panel ref={ref} className={cn("min-h-0 min-w-0 overflow-hidden", className)} {...props} />
));
ResizablePanel.displayName = ResizablePrimitive.Panel.displayName;

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof ResizablePrimitive.PanelResizeHandle> & {
    withHandle?: boolean;
  }
>(({ withHandle, className, ...props }, _ref) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "group/handle relative flex shrink-0 items-center justify-center select-none",
      // Horizontal handle (default): thin dark bar like in image
      "w-[5px] cursor-col-resize bg-muted/20 transition-all duration-200",
      "hover:bg-primary/20 active:bg-primary/30",
      // Invisible wider hit area so it's easy to grab
      "after:absolute after:inset-y-0 after:left-1/2 after:w-5 after:-translate-x-1/2",
      // Vertical direction overrides
      "data-[panel-group-direction=vertical]:h-[5px] data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
      "data-[panel-group-direction=vertical]:hover:bg-primary/20",
      "data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:inset-y-auto data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-5 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      "focus-visible:outline-none",
      className,
    )}
    {...props}
  >
    {/* Pill handle — always rendered, opacity driven by group-hover */}
    <div
      className={cn(
        "pointer-events-none z-10 flex items-center justify-center",
        "transition-all duration-200",
        // Horizontal pill
        "h-10 w-[4px] rounded-full bg-border group-hover/handle:bg-primary group-hover/handle:shadow-[0_0_8px_hsl(var(--primary)/0.6)] group-[data-resize-handle-state=drag]/handle:bg-primary",
        // Vertical pill
        "data-[panel-group-direction=vertical]:w-10 data-[panel-group-direction=vertical]:h-[4px]",
      )}
    />
  </ResizablePrimitive.PanelResizeHandle>
));
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
