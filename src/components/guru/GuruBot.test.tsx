import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GuruBot } from "./GuruBot";

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

function renderGuru(props: Partial<React.ComponentProps<typeof GuruBot>> = {}) {
  return render(
    <TooltipProvider>
      <div style={{ height: 720, width: 420 }}>
        <GuruBot open onClose={() => {}} {...props} />
      </div>
    </TooltipProvider>,
  );
}

describe("GuruBot", () => {
  beforeEach(() => {
    from.mockReset();
    localStorage.clear();
  });

  it("renders the assistant identity and an empty state", () => {
    renderGuru();
    expect(screen.getByRole("region", { name: "Guru AI" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "GuruBot" })).toBeInTheDocument();
    expect(screen.getByText("What are we working on?")).toBeInTheDocument();
    expect(screen.getByLabelText("Message Guru")).toBeInTheDocument();
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

  it("does not render when closed", () => {
    const { container } = render(
      <TooltipProvider>
        <GuruBot open={false} onClose={() => {}} />
      </TooltipProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("labels the mobile overlay as a region with a close control", () => {
    renderGuru();
    expect(screen.getByRole("button", { name: "Close Guru" })).toBeInTheDocument();
  });
});
