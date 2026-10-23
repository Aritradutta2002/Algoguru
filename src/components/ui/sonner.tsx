import { Toaster as Sonner, toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useSettings();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-border/80 group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-overlay group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
