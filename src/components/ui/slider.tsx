import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center group",
      className
    )}
    {...props}
  >
    {/* Track */}
    <SliderPrimitive.Track
      className="relative h-1.5 w-full grow overflow-hidden rounded-full transition-all duration-200"
      style={{ background: "hsl(var(--muted))" }}
    >
      {/* Filled range with gradient */}
      <SliderPrimitive.Range
        className="absolute h-full rounded-full transition-all duration-150"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)/0.85) 0%, hsl(var(--primary)) 100%)",
          boxShadow: "0 0 6px hsl(var(--primary)/0.35)",
        }}
      />
    </SliderPrimitive.Track>

    {/* Thumb */}
    <SliderPrimitive.Thumb
      className={cn(
        "block h-4 w-4 rounded-full border-2 bg-background",
        "transition-all duration-150 ease-out",
        "hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        "cursor-grab active:cursor-grabbing active:scale-95"
      )}
      style={{
        borderColor: "hsl(var(--primary))",
        boxShadow: "0 0 0 3px hsl(var(--primary)/0.15), 0 1px 4px hsl(var(--primary)/0.3)",
      }}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
