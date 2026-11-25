import { useState, type ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DraggableNoteEditor } from "@/components/DraggableNoteEditor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InterviewNotesDrawer } from "./InterviewNotesDrawer";

type DrawerProps = Omit<
  ComponentProps<typeof InterviewNotesDrawer>,
  "open" | "onClose"
>;

function renderDrawer(overrides: Partial<DrawerProps> = {}) {
  const onClose = vi.fn();
  const props: DrawerProps = {
    notesMap: {},
    getQuestionMeta: (id) => ({ title: `Question ${id}` }),
    deletingNoteId: null,
    onDeleteNote: vi.fn(),
    onDownloadPdf: vi.fn(),
    ...overrides,
  };

  function Harness() {
    const [open, setOpen] = useState(false);

    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open notes
        </button>
        <TooltipProvider>
          <InterviewNotesDrawer
            {...props}
            open={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          />
        </TooltipProvider>
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Open notes" });
  trigger.focus();
  fireEvent.click(trigger);

  return { ...props, onClose, trigger };
}

describe("InterviewNotesDrawer", () => {
  it("names the modal drawer and hides background content from assistive technology", () => {
    const { trigger } = renderDrawer();

    const dialog = screen.getByRole("dialog", { name: "My Notes" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(trigger.closest('[aria-hidden="true"]')).toBeInTheDocument();

    for (const attribute of ["aria-labelledby", "aria-describedby"]) {
      const referencedIds = dialog.getAttribute(attribute)?.split(/\s+/) ?? [];
      expect(referencedIds.length).toBeGreaterThan(0);
      for (const id of referencedIds) {
        expect(document.getElementById(id)).toBeInTheDocument();
      }
    }
  });

  it("dismisses when Escape is pressed", async () => {
    const { onClose } = renderDrawer();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "My Notes" })).not.toBeInTheDocument();
    });
  });

  it("keeps the custom close control and restores focus to the trigger", async () => {
    const { onClose, trigger } = renderDrawer();

    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    const closeButton = screen.getByRole("button", { name: "Close notes panel" });
    closeButton.focus();
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "My Notes" })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("shows the empty state when there are no saved notes", () => {
    renderDrawer();

    expect(screen.getByText("0 saved notes")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No notes yet" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download notes as PDF" }),
    ).not.toBeInTheDocument();
  });

  it("constrains long note lists inside the drawer scroll area", () => {
    const notesMap = Object.fromEntries(
      Array.from({ length: 40 }, (_, index) => [
        `question-${index}`,
        `Note ${index}`,
      ]),
    );
    renderDrawer({ notesMap });

    const dialog = screen.getByRole("dialog", { name: "My Notes" });
    const viewport = dialog.querySelector(
      '[data-radix-scroll-area-viewport]',
    );
    const scrollArea = viewport?.parentElement;

    expect(dialog).toHaveClass("flex", "h-full", "flex-col", "overflow-hidden");
    expect(scrollArea).toHaveClass("min-h-0", "flex-1");
  });

  it("renders a populated note with its question metadata and markdown", () => {
    renderDrawer({
      notesMap: { "binary-search": "Remember **binary search**." },
      getQuestionMeta: () => ({
        title: "Binary Search",
        href: "/interview/java/binary-search",
      }),
    });

    expect(screen.getByText("1 saved note")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Binary Search" }),
    ).toHaveAttribute("href", "/interview/java/binary-search");
    expect(screen.getByText("binary search").tagName).toBe("STRONG");
  });

  it("preserves download, delete, and edit note actions", () => {
    const onDeleteNote = vi.fn();
    const onEditNote = vi.fn();
    const onDownloadPdf = vi.fn();
    const { onClose } = renderDrawer({
      notesMap: { "binary-search": "Remember binary search." },
      onDeleteNote,
      onEditNote,
      onDownloadPdf,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Download notes as PDF" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit note →" }));

    expect(onDownloadPdf).toHaveBeenCalledTimes(1);
    expect(onDeleteNote).toHaveBeenCalledWith("binary-search");
    expect(onEditNote).toHaveBeenCalledWith("binary-search");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves focus in the note editor after choosing Edit", async () => {
    function EditHarness() {
      const [open, setOpen] = useState(false);
      const [editing, setEditing] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open notes
          </button>
          <TooltipProvider>
            <InterviewNotesDrawer
              open={open}
              onClose={() => setOpen(false)}
              notesMap={{ "binary-search": "Remember binary search." }}
              getQuestionMeta={(id) => ({ title: `Question ${id}` })}
              deletingNoteId={null}
              onDeleteNote={vi.fn()}
              onEditNote={() => setEditing(true)}
              onDownloadPdf={vi.fn()}
            />
          </TooltipProvider>
          {editing && (
            <TooltipProvider>
              <DraggableNoteEditor
                questionTitle="Binary Search"
                value="Remember binary search."
                onChange={() => {}}
                onClose={() => setEditing(false)}
                onSave={() => {}}
                isSaving={false}
              />
            </TooltipProvider>
          )}
        </>
      );
    }

    render(<EditHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Open notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit note →" }));

    const editor = await screen.findByPlaceholderText(/Write your notes/);
    await waitFor(() => expect(editor).toHaveFocus());
    expect(editor).toHaveClass("focus-visible:ring-2", "focus-visible:ring-ring/20");
    expect(editor).not.toHaveClass("focus-visible:ring-0");
  });
});
