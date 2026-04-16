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
      // LeetCode-style: thin line, expands on hover
      "w-[2px] cursor-col-resize bg-border/40 transition-all duration-150",
      "hover:bg-primary/30 hover:w-[4px] active:bg-primary/50 active:w-[4px]",
      // Invisible hit area for easy grabbing
      "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
      // Vertical direction
      "data-[panel-group-direction=vertical]:h-[2px] data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize",
      "data-[panel-group-direction=vertical]:hover:h-[4px] data-[panel-group-direction=vertical]:active:h-[4px]",
      "data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:inset-y-auto data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-4 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="pointer-events-none z-10 flex items-center justify-center opacity-0 group-hover/handle:opacity-100 transition-opacity duration-150">
        <div className="h-6 w-[3px] rounded-full bg-primary/30" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
));
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
