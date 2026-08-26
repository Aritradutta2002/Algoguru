import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function EditorQuickOpen({
  open,
  onOpenChange,
  tabs,
  activeId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tabs: { id: string; title: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Go to tab…" />
      <CommandList>
        <CommandEmpty>No tabs found.</CommandEmpty>
        <CommandGroup heading="Open tabs">
          {tabs.map((tab) => (
            <CommandItem
              key={tab.id}
              value={`${tab.title} ${tab.id}`}
              onSelect={() => {
                onOpenChange(false);
                onSelect(tab.id);
              }}
            >
              <span>{tab.title}</span>
              {tab.id === activeId ? (
                <span className="ml-auto text-[11px] text-muted-foreground">Active</span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
