import { useState, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DraggableNoteEditor } from "./DraggableNoteEditor";
import { TooltipProvider } from "@/components/ui/tooltip";

type EditorProps = ComponentProps<typeof DraggableNoteEditor>;

const originalViewport = {
  width: window.innerWidth,
  height: window.innerHeight,
};

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value: height,
  });
}

function getNoteWindow(title = "Binary search") {
  const titleBar = screen.getByText(title).parentElement;
  if (!titleBar?.parentElement) {
    throw new Error("Note window title bar is missing");
  }
  return titleBar.parentElement;
}

function getTitleBar() {
  const titleBar = within(getNoteWindow()).getByText("Binary search").parentElement;
  if (!titleBar) {
    throw new Error("Note window title bar is missing");
  }
  return titleBar;
}

function getScrollRegion() {
  const editor = screen.getByRole("textbox");
  const scrollRegion = editor.parentElement?.parentElement;
  if (!scrollRegion) {
    throw new Error("Note editor scroll region is missing");
  }
  return scrollRegion;
}

function renderEditor(overrides: Partial<EditorProps> = {}) {
  const props: EditorProps = {
    questionTitle: "Binary search",
    value: "Remember the midpoint.",
    onChange: vi.fn(),
    onClose: vi.fn(),
    onSave: vi.fn(),
    isSaving: false,
    ...overrides,
  };

  const view = render(
    <TooltipProvider>
      <DraggableNoteEditor {...props} />
    </TooltipProvider>,
  );

  return { ...view, ...props };
}

function EditorHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open note
      </button>
      {open && (
        <TooltipProvider>
          <DraggableNoteEditor
            questionTitle="Binary search"
            value="Remember the midpoint."
            onChange={() => {}}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            onSave={() => {}}
            isSaving={false}
          />
        </TooltipProvider>
      )}
    </>
  );
}

function openFromTrigger() {
  render(<EditorHarness onClose={vi.fn()} />);
  const trigger = screen.getByRole("button", { name: "Open note" });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

beforeEach(() => {
  setViewport(1024, 768);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  setViewport(originalViewport.width, originalViewport.height);
  vi.restoreAllMocks();
});

describe("DraggableNoteEditor", () => {
  it("exposes an accessible dialog name without making it modal", () => {
    renderEditor();

    expect(
      screen.getByRole("dialog", { name: "Note editor: Binary search" }),
    ).toHaveAttribute("aria-modal", "false");
  });

  it("continues to move focus into the rich-text editor on open", async () => {
    renderEditor();

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveFocus();
    });
  });

  it("shrinks to fit a narrow viewport with side gutters", () => {
    setViewport(375, 568);
    renderEditor();

    const dialog = getNoteWindow();
    expect(dialog).toHaveStyle({ width: "343px", left: "16px" });
  });

  it("recenters and shrinks when the viewport becomes narrow", () => {
    renderEditor();
    const dialog = getNoteWindow();
    expect(dialog).toHaveStyle({ left: "272px" });

    setViewport(375, 320);
    fireEvent(window, new Event("resize"));

    expect(dialog).toHaveStyle({
      width: "343px",
      left: "16px",
      top: "24px",
      maxHeight: "min(440px, max(0px, calc(100dvh - 48px)))",
    });
  });

  it("keeps the footer outside the scroll region in a short viewport", async () => {
    setViewport(375, 320);
    renderEditor();

    const dialog = getNoteWindow();
    const scrollRegion = getScrollRegion();
    const body = scrollRegion.parentElement;
    const save = screen.getByRole("button", { name: "Save Note" });
    const footer = save.parentElement?.parentElement;

    expect(dialog).toHaveClass("overflow-hidden");
    expect(dialog).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      maxHeight: "min(440px, max(0px, calc(100dvh - 48px)))",
    });
    expect(body).toHaveStyle({
      display: "flex",
      flexDirection: "column",
      flex: "1 1 auto",
      minHeight: "0",
      overflow: "hidden",
    });
    expect(scrollRegion).toHaveStyle({
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
    });
    expect(footer).toHaveStyle({ flexShrink: "0" });
    expect(body).toContainElement(scrollRegion);
    expect(body).toContainElement(footer);
    expect(scrollRegion).not.toContainElement(footer);
    expect(save).toBeEnabled();
    await waitFor(() => expect(save).toBeVisible());
  });

  it("keeps the first render inside a 375x320 viewport before effects run", () => {
    setViewport(375, 320);

    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <DraggableNoteEditor
          questionTitle="Binary search"
          value="Remember the midpoint."
          onChange={() => {}}
          onClose={() => {}}
          onSave={() => {}}
          isSaving={false}
        />
      </TooltipProvider>,
    );
    const container = document.createElement("div");
    container.innerHTML = markup;
    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');

    expect(dialog).toHaveStyle({
      left: "16px",
      top: "0px",
      width: "480px",
      maxWidth: "min(480px, max(0px, calc(100vw - 32px)))",
      maxHeight: "min(440px, max(0px, calc(100dvh - 48px)))",
    });
  });

  it.each(["mouse", "touch"] as const)(
    "requires %s dragging to move and clamp both axes in an intermediate viewport",
    (input) => {
      setViewport(900, 700);
      renderEditor();

      const dialog = getNoteWindow();
      const titleBar = getTitleBar();
      expect(dialog).toHaveStyle({ left: "210px", top: "130px" });

      if (input === "mouse") {
        fireEvent.mouseDown(titleBar, { clientX: 250, clientY: 170 });
        fireEvent.mouseMove(window, { clientX: 290, clientY: 190 });
        fireEvent.mouseUp(window);
      } else {
        fireEvent.touchStart(titleBar, {
          touches: [{ clientX: 250, clientY: 170 }],
        });
        fireEvent.touchMove(window, {
          touches: [{ clientX: 290, clientY: 190 }],
        });
        fireEvent.touchEnd(window);
      }

      expect(dialog).toHaveStyle({ left: "250px", top: "150px" });
      expect(dialog.style.left).not.toBe("210px");
      expect(dialog.style.top).not.toBe("130px");

      if (input === "mouse") {
        fireEvent.mouseDown(titleBar, { clientX: 290, clientY: 190 });
        fireEvent.mouseMove(window, { clientX: -500, clientY: -500 });
      } else {
        fireEvent.touchStart(titleBar, {
          touches: [{ clientX: 290, clientY: 190 }],
        });
        fireEvent.touchMove(window, {
          touches: [{ clientX: -500, clientY: -500 }],
        });
      }

      expect(dialog).toHaveStyle({ left: "16px", top: "0px" });

      if (input === "mouse") {
        fireEvent.mouseMove(window, { clientX: 2000, clientY: 2000 });
        fireEvent.mouseUp(window);
      } else {
        fireEvent.touchMove(window, {
          touches: [{ clientX: 2000, clientY: 2000 }],
        });
        fireEvent.touchEnd(window);
      }

      expect(dialog).toHaveStyle({
        left: "404px",
        top: "236px",
      });
    },
  );

  it.each(["mouse", "touch"] as const)(
    "keeps %s dragging inside the narrow viewport instead of clamping x offscreen",
    (input) => {
      setViewport(375, 568);
      renderEditor();

      const dialog = getNoteWindow();
      const titleBar = getTitleBar();

      if (input === "mouse") {
        fireEvent.mouseDown(titleBar, { clientX: 200, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: -200, clientY: -100 });
      } else {
        fireEvent.touchStart(titleBar, {
          touches: [{ clientX: 200, clientY: 100 }],
        });
        fireEvent.touchMove(window, {
          touches: [{ clientX: -200, clientY: -100 }],
        });
      }

      expect(dialog).toHaveStyle({ left: "16px", top: "0px" });

      if (input === "mouse") {
        fireEvent.mouseMove(window, { clientX: 900, clientY: 500 });
        fireEvent.mouseUp(window);
      } else {
        fireEvent.touchMove(window, {
          touches: [{ clientX: 900, clientY: 500 }],
        });
        fireEvent.touchEnd(window);
      }

      expect(dialog).toHaveStyle({
        left: "16px",
        top: "104px",
        width: "343px",
        maxWidth: "min(480px, max(0px, calc(100vw - 32px)))",
      });
    },
  );

  it("closes only the topmost note on Escape, then allows the next note to close", () => {
    const firstClose = vi.fn();
    const secondClose = vi.fn();
    const first = (
      <DraggableNoteEditor
        questionTitle="First note"
        value=""
        onChange={() => {}}
        onClose={firstClose}
        onSave={() => {}}
        isSaving={false}
      />
    );
    const { rerender } = render(
      <TooltipProvider>
        {first}
        <DraggableNoteEditor
          questionTitle="Second note"
          value=""
          onChange={() => {}}
          onClose={secondClose}
          onSave={() => {}}
          isSaving={false}
        />
      </TooltipProvider>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).not.toHaveBeenCalled();
    expect(secondClose).toHaveBeenCalledTimes(1);

    rerender(<TooltipProvider>{first}</TooltipProvider>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(firstClose).toHaveBeenCalledTimes(1);
    expect(secondClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the connected opener when the editor unmounts", async () => {
    const trigger = openFromTrigger();
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it.each(["hidden", "disconnected"] as const)(
    "does not restore focus to a %s opener",
    async (state) => {
      const trigger = openFromTrigger();
      await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
      const focus = vi.spyOn(trigger, "focus");

      const parent = trigger.parentElement;
      if (state === "hidden") {
        trigger.hidden = true;
      } else {
        trigger.remove();
      }
      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      expect(focus).not.toHaveBeenCalled();
      expect(trigger).not.toHaveFocus();
      if (state === "disconnected") {
        parent?.appendChild(trigger);
      }
    },
  );

  it("preserves minimize, expand, and save interactions", async () => {
    const { onSave } = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Note" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
