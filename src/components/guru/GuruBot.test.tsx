import { useState, type ComponentProps, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuruBot } from "./GuruBot";
import * as GuruBotModule from "./GuruBot";

const mocks = vi.hoisted(() => ({
  mediaQuery: vi.fn(() => false),
  chatBusy: false,
  chatOwner: vi.fn(),
  stop: vi.fn(),
}));

const from = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false, session: null, profile: null }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    auth: { getSession: async () => ({ data: { session: null } }) },
  },
}));

vi.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: mocks.mediaQuery }));

vi.mock("./useGuruChat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./useGuruChat")>();
  const { useCallback, useEffect, useState } = await import("react");
  return {
    useGuruChat(options: Parameters<typeof actual.useGuruChat>[0]) {
      const chat = actual.useGuruChat(options);
      useEffect(() => {
        mocks.chatOwner(options.scope);
      }, [options.scope]);
      const [busy, setBusy] = useState(mocks.chatBusy);
      const stop = useCallback(() => {
        mocks.stop();
        setBusy(false);
      }, []);
      return {
        ...chat,
        busy,
        status: busy ? "streaming" : chat.status,
        stop,
      };
    },
  };
});

type GuruBotProps = ComponentProps<typeof GuruBot>;

function renderGuru(props: Partial<GuruBotProps> = {}) {
  const ui = (currentProps: Partial<GuruBotProps>) => (
    <TooltipProvider delayDuration={0}>
      <div data-testid="guru-host" style={{ height: 720, width: 420 }}>
        <GuruBot open onClose={() => {}} {...currentProps} />
      </div>
    </TooltipProvider>
  );
  const view = render(ui(props));
  return {
    ...view,
    rerenderGuru: (nextProps: Partial<GuruBotProps> = props) => view.rerender(ui(nextProps)),
  };
}

function renderControlledMobileGuru() {
  const onClose = vi.fn();

  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <TooltipProvider delayDuration={0}>
        <button type="button" onClick={() => setOpen(true)}>
          Open Guru
        </button>
        <GuruBot
          open={open}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      </TooltipProvider>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Open Guru" });
  trigger.focus();
  fireEvent.click(trigger);
  return { onClose, trigger };
}

describe("GuruBot", () => {
  beforeEach(() => {
    mocks.mediaQuery.mockReset().mockReturnValue(false);
    mocks.chatBusy = false;
    mocks.chatOwner.mockReset();
    mocks.stop.mockReset();
    from.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  });

  it("renders the assistant identity and an empty state", () => {
    renderGuru();
    expect(screen.getByRole("region", { name: "Guru AI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "GuruBot" })).toBeInTheDocument();
    expect(screen.getByText("What are we working on?")).toBeInTheDocument();
    expect(screen.getByLabelText("Message Guru")).toBeInTheDocument();
  });

  it("shows a live status pill in the Guru header", () => {
    renderGuru();
    expect(screen.getByRole("status")).toHaveTextContent("Ready");
  });

  it("shows coaching copy in debug mode", () => {
    renderGuru({ debugMode: true, questionId: "1", initialContext: "class Solution {}" });
    expect(screen.getByText("Let's debug this together")).toBeInTheDocument();
    expect(
      screen.getByText(/Problem, code and last run attached/),
    ).toBeInTheDocument();
  });

  it("fills the composer from a suggestion without sending", () => {
    renderGuru({ suggestedPrompts: ["Explain two pointers"] });
    fireEvent.click(screen.getByRole("button", { name: /Explain two pointers/ }));
    expect(screen.getByLabelText("Message Guru")).toHaveValue("Explain two pointers");
  });

  it("opens history and can return to the chat", () => {
    renderGuru();
    fireEvent.click(screen.getByRole("button", { name: "Chat history" }));
    const panel = screen.getByRole("complementary", { name: "Chat history" });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("No conversations yet")).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: "Back to chat" }));
    expect(screen.getByLabelText("Message Guru")).toBeInTheDocument();
  });

  it("prefills the prompt the host opened it with", () => {
    renderGuru({ debugMode: true, initialPrompt: "Why does test 3 fail?" });
    expect(screen.getByLabelText("Message Guru")).toHaveValue("Why does test 3 fail?");
  });

  it("keeps the host prompt when a previous chat and draft are restored", () => {
    const now = Date.now();
    localStorage.setItem(
      "guru-chat-history:guest:global",
      JSON.stringify([
        {
          id: "earlier",
          title: "Earlier chat",
          messages: [
            { id: "m1", role: "user", content: "older question", createdAt: now - 1000 },
          ],
          model: "openrouter",
          date: now - 1000,
          pinned: false,
        },
      ]),
    );
    localStorage.setItem("guru-draft:guest:global:earlier", "stale draft");

    renderGuru({ initialPrompt: "Why does test 3 fail?" });

    expect(screen.getByLabelText("Message Guru")).toHaveValue("Why does test 3 fail?");
  });

  it("renders stored tool-call replies as readable coaching text", () => {
    const now = Date.now();
    localStorage.setItem(
      "guru-chat-history:guest:global",
      JSON.stringify([
        {
          id: "tool-chat",
          title: "DP help",
          messages: [
            { id: "u1", role: "user", content: "help with dp", createdAt: now - 1000 },
            {
              id: "a1",
              role: "assistant",
              content:
                "_call_start|>\n" +
                "[question(\n" +
                "  question='Your code is currently just a skeleton...',\n" +
                "  hint='Think about what dp[i][j] should represent...',\n" +
                "  query='What should the DP state dp[i][j] represent...?'\n" +
                ")]\n" +
                "<|tool_call_end|>",
              createdAt: now,
            },
          ],
          model: "openrouter",
          date: now,
          pinned: false,
        },
      ]),
    );

    renderGuru();

    expect(
      screen.getByText("What should the DP state dp[i][j] represent...?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Think about what dp\[i\]\[j\] should represent/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/_call_start/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\[question\(/)).not.toBeInTheDocument();
  });

  it("offers slash commands and inserts the template", () => {
    renderGuru();
    const input = screen.getByLabelText("Message Guru");
    fireEvent.change(input, { target: { value: "/" } });
    expect(screen.getByRole("listbox", { name: "Slash commands" })).toBeInTheDocument();
  });

  it("renders true mobile as a named modal Dialog portaled into the body", () => {
    mocks.mediaQuery.mockReturnValue(true);
    renderGuru();

    const dialog = screen.getByRole("dialog", { name: "Guru AI" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.parentElement).toBe(document.body);
    expect(screen.getByTestId("guru-host").closest('[aria-hidden="true"]')).toBeInTheDocument();
    expect(document.body).toHaveAttribute("data-scroll-locked", "1");
    expect(window.getComputedStyle(document.body).overflow).toBe("hidden");
  });

  it("preserves the fullscreen mobile layout and safe-area padding", () => {
    const paddingTopSetter = vi.spyOn(CSSStyleDeclaration.prototype, "paddingTop", "set");
    const paddingBottomSetter = vi.spyOn(CSSStyleDeclaration.prototype, "paddingBottom", "set");
    try {
      mocks.mediaQuery.mockReturnValue(true);
      renderGuru();
      const dialog = screen.getByRole("dialog", { name: "Guru AI" });

      expect(paddingTopSetter).toHaveBeenCalledWith("env(safe-area-inset-top)");
      expect(paddingBottomSetter).toHaveBeenCalledWith("env(safe-area-inset-bottom)");
      expect(dialog).toHaveClass(
        "guru-cockpit",
        "fixed",
        "inset-0",
        "z-50",
        "h-full",
        "w-full",
        "max-w-none",
        "flex",
        "flex-col",
        "overflow-hidden",
        "translate-x-0",
        "translate-y-0",
        "gap-0",
        "rounded-none",
        "border-0",
        "p-0",
        "shadow-[none]",
        "bg-guru-bg",
        "text-guru-text",
        "animate-in",
        "fade-in",
        "slide-in-from-bottom-2",
        "duration-200",
      );
      expect(dialog).not.toHaveClass(
        "max-w-lg",
        "rounded-xl",
        "border-obsidian-border",
        "bg-obsidian-pane",
        "p-6",
        "sm:p-7",
        "translate-x-[-50%]",
        "translate-y-[-50%]",
      );
      expect(dialog.previousElementSibling).toHaveClass("bg-transparent", "backdrop-blur-none");
    } finally {
      paddingTopSetter.mockRestore();
      paddingBottomSetter.mockRestore();
    }
  });

  it("traps Tab focus inside the mobile Dialog", () => {
    mocks.mediaQuery.mockReturnValue(true);
    renderGuru();
    const first = screen.getByRole("button", { name: "New chat" });
    const last = screen.getByRole("button", { name: "Attach editor context" });

    act(() => last.focus());
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("closes the mobile Dialog on Escape and restores focus to its opener", async () => {
    mocks.mediaQuery.mockReturnValue(true);
    const { onClose, trigger } = renderControlledMobileGuru();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Guru AI" })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });

  it("closes mobile history before dismissing Guru on Escape", () => {
    mocks.mediaQuery.mockReturnValue(true);
    const onClose = vi.fn();
    renderGuru({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Chat history" }));
    expect(screen.getByRole("complementary", { name: "Chat history" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("complementary", { name: "Chat history" })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Guru AI" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops generation from the focused composer on Escape without closing the mobile Dialog", async () => {
    mocks.mediaQuery.mockReturnValue(true);
    mocks.chatBusy = true;
    const onClose = vi.fn();
    renderGuru({ onClose });
    const input = screen.getByLabelText("Message Guru");
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.keyDown(input, { key: "Escape" });

    expect(mocks.stop).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Guru AI" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop generating" })).not.toBeInTheDocument();
  });

  it("prioritizes stopping generation over closing mobile history", () => {
    mocks.mediaQuery.mockReturnValue(true);
    mocks.chatBusy = true;
    const onClose = vi.fn();
    renderGuru({ onClose });
    fireEvent.click(screen.getByRole("button", { name: "Chat history" }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mocks.stop).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("complementary", { name: "Chat history" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Guru AI" })).toBeInTheDocument();
  });

  it("keeps the mobile Close Guru control working", () => {
    mocks.mediaQuery.mockReturnValue(true);
    const onClose = vi.fn();
    renderGuru({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Close Guru" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps delayed composer focus when mobile mode replaces the desktop region", async () => {
    const { rerenderGuru } = renderGuru();
    await waitFor(() => expect(screen.getByLabelText("Message Guru")).toHaveFocus());

    mocks.mediaQuery.mockReturnValue(true);
    rerenderGuru();

    expect(screen.getByRole("dialog", { name: "Guru AI" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Message Guru")).toHaveFocus());
  });

  it.each([
    { mode: "desktop", isMobile: false, embedded: false },
    { mode: "embedded mobile", isMobile: true, embedded: true },
  ])("keeps $mode mode as a region", ({ isMobile, embedded }) => {
    mocks.mediaQuery.mockReturnValue(isMobile);
    renderGuru({ embedded });

    expect(screen.getByRole("region", { name: "Guru AI" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
  });

  it("shares one chat owner, draft, history, and attachment state across provided views", () => {
    const GuruChatProvider = (GuruBotModule as unknown as {
      GuruChatProvider: (props: {
        children: ReactNode;
        questionId: string;
        debugMode?: boolean;
        initialContext?: string;
        initialPrompt?: string;
      }) => ReactNode;
    }).GuruChatProvider;

    function SharedGuruHarness() {
      const [fullscreen, setFullscreen] = useState(false);
      return (
        <TooltipProvider delayDuration={0}>
          <GuruChatProvider
            questionId="1"
            debugMode
            initialContext="class Solution {}"
            initialPrompt="Shared prompt"
          >
            <div data-testid="inline-guru" hidden={fullscreen}>
              <GuruBot
                open={!fullscreen}
                onClose={() => {}}
                embedded
                debugMode
                questionId="1"
                initialContext="class Solution {}"
                onToggleFullscreen={() => setFullscreen(true)}
              />
            </div>
            {fullscreen && (
              <div data-testid="fullscreen-guru">
                <GuruBot
                  open
                  onClose={() => setFullscreen(false)}
                  embedded
                  debugMode
                  questionId="1"
                  initialContext="class Solution {}"
                  onToggleFullscreen={() => setFullscreen(false)}
                  isFullscreen
                />
              </div>
            )}
          </GuruChatProvider>
        </TooltipProvider>
      );
    }

    render(<SharedGuruHarness />);
    const inline = within(screen.getByTestId("inline-guru"));
    expect(inline.getByLabelText("Message Guru")).toHaveValue("Shared prompt");
    fireEvent.change(inline.getByLabelText("Message Guru"), {
      target: { value: "Preserve this draft" },
    });
    fireEvent.click(inline.getByRole("button", { name: /Editor context attached/ }));
    fireEvent.click(inline.getByRole("button", { name: "Chat history" }));
    fireEvent.click(inline.getByRole("button", { name: "Expand panel" }));

    const fullscreen = within(screen.getByTestId("fullscreen-guru"));
    const history = fullscreen.getByRole("complementary", { name: "Chat history" });
    expect(history).toBeInTheDocument();
    fireEvent.click(within(history).getByRole("button", { name: "Back to chat" }));
    expect(fullscreen.getByLabelText("Message Guru")).toHaveValue("Preserve this draft");
    expect(fullscreen.getByRole("button", { name: "Attach editor context" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(mocks.chatOwner).toHaveBeenCalledTimes(1);
    expect(mocks.chatOwner).toHaveBeenCalledWith("1");

    fireEvent.click(fullscreen.getByRole("button", { name: "Restore panel" }));
    const restored = within(screen.getByTestId("inline-guru"));
    expect(restored.getByLabelText("Message Guru")).toHaveValue("Preserve this draft");
    expect(restored.getByRole("button", { name: "Attach editor context" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(mocks.chatOwner).toHaveBeenCalledTimes(1);
  });

  it("does not render when closed on mobile", () => {
    mocks.mediaQuery.mockReturnValue(true);
    const { container } = render(
      <TooltipProvider delayDuration={0}>
        <GuruBot open={false} onClose={() => {}} />
      </TooltipProvider>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
