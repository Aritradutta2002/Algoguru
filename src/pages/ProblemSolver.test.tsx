import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { HTMLAttributes } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProblemSolver from "@/pages/ProblemSolver";
import type { DailyChallengeResponse } from "@/types/leetcode";

const mocks = vi.hoisted(() => ({
  dailyChallenge: vi.fn(),
  mediaQuery: vi.fn(),
  auth: vi.fn(),
  from: vi.fn(),
  readSavedCode: vi.fn(),
  upsert: vi.fn(),
  refetch: vi.fn(),
  fetch: vi.fn(),
}));

// Keep the page's file/draft state real without loading Monaco or its workers.
vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Code editor"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

// Avoid animation timing and exit nodes obscuring visibility/state assertions.
vi.mock("framer-motion", async () => {
  const { createElement, forwardRef } = await import("react");
  const animationProps = new Set(["initial", "animate", "exit", "transition", "layout", "layoutId"]);
  const element = (tag: "div" | "span") => {
    const Component = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & Record<string, unknown>>(
      (props, ref) => createElement(tag, {
        ...Object.fromEntries(Object.entries(props).filter(([key]) => !animationProps.has(key))),
        ref,
      }),
    );
    Component.displayName = `MockMotion.${tag}`;
    return Component;
  };
  return {
    motion: { div: element("div"), span: element("span") },
    AnimatePresence: ({ children }: HTMLAttributes<HTMLElement>) => <>{children}</>,
  };
});

// Layout measurements and saved split sizes are not part of the page contract.
vi.mock("react-resizable-panels", async () => {
  const { forwardRef } = await import("react");
  const Container = ({ children, className, style, hidden }: HTMLAttributes<HTMLDivElement>) => (
    <div className={className} style={style} hidden={hidden}>{children}</div>
  );
  const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ children, className, style, hidden }, ref) => (
      <div ref={ref} className={className} style={style} hidden={hidden}>{children}</div>
    ),
  );
  Panel.displayName = "MockPanel";
  return { PanelGroup: Container, Panel, PanelResizeHandle: Container };
});

vi.mock("@/components/GuruBot", () => ({
  GuruBot: ({ onClose }: { onClose: () => void }) => (
    <section aria-label="Guru assistant">
      <button type="button" onClick={onClose}>Close assistant</button>
    </section>
  ),
}));

vi.mock("@/hooks/useDailyChallenge", () => ({
  useDailyChallenge: mocks.dailyChallenge,
}));
vi.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: mocks.mediaQuery }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: mocks.auth }));
vi.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({ theme: "dark" }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mocks.from },
}));

const JAVA_STARTER = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}`;

const JAVA_DRAFT = `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`;

const HELPER_DRAFT = `class Helper1 {
    static int complement(int target, int value) {
        return target - value;
    }
}`;

const FIRST_INPUT = "[2,7,11,15]\n9";
const CUSTOM_INPUT = "[5,8,13]\n13";
const DESCRIPTION = "Return the indices of the two numbers whose sum equals the target.";
const EDITORIAL = "Store each number and its index in a hash map to find its complement in one pass.";
const HINTS = [
  "A brute-force search checks every pair of numbers.",
  "Use a hash map to look up the complement in constant time.",
];

function dailyFixture(): DailyChallengeResponse {
  return {
    date: "2026-10-16",
    fetchedAt: "2026-10-16T00:05:00.000Z",
    source: "upstream",
    stale: false,
    problem: {
      questionId: "1",
      title: "Two Sum",
      titleSlug: "two-sum",
      difficulty: "Easy",
      content: `<p>${DESCRIPTION}</p>
        <p><strong>Example 1:</strong></p>
        <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> nums[0] + nums[1] equals 9.</pre>
        <p><strong>Example 2:</strong></p>
        <pre><strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
<strong>Explanation:</strong> nums[1] + nums[2] equals 6.</pre>`,
      exampleTestcases: `${FIRST_INPUT}\n[3,2,4]\n6`,
      topicTags: [{ name: "Array", slug: "array" }, { name: "Hash Table", slug: "hash-table" }],
      hints: [...HINTS],
      acRate: 56.7,
      link: "https://leetcode.com/problems/two-sum/",
      solution: `## Complement lookup\n\n${EDITORIAL}`,
      codeSnippets: [{ langSlug: "java", code: JAVA_STARTER }],
    },
  };
}

function readyState(data = dailyFixture()) {
  return { data, isLoading: false, isError: false, error: null, refetch: mocks.refetch };
}

function renderSolver() {
  return render(
    <MemoryRouter
      initialEntries={["/problem-solver"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/problem-solver" element={<ProblemSolver />} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function loadedEditor(expected = JAVA_STARTER) {
  const editor = await screen.findByRole("textbox", { name: "Code editor" });
  await waitFor(() => expect((editor as HTMLTextAreaElement).value).toContain(expected));
  return editor;
}

async function openCompactEditor() {
  mocks.mediaQuery.mockReturnValue(true);
  renderSolver();
  fireEvent.click(screen.getByRole("tab", { name: "Editor" }));
  return loadedEditor();
}

function switchCompactPane(name: "Problem" | "Editor") {
  fireEvent.click(screen.getByRole("tab", { name }));
}

let visibilityStyles: HTMLStyleElement;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.dailyChallenge.mockReturnValue(readyState());
  mocks.mediaQuery.mockReturnValue(false);
  mocks.auth.mockReturnValue({ user: null });
  mocks.readSavedCode.mockResolvedValue({ data: null, error: null });
  mocks.upsert.mockResolvedValue({ data: null, error: null });
  mocks.refetch.mockResolvedValue({});
  mocks.from.mockImplementation(() => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      delete: vi.fn(() => query),
      maybeSingle: mocks.readSavedCode,
      upsert: mocks.upsert,
    };
    return query;
  });
  mocks.fetch.mockRejectedValue(new Error("Unexpected network request in ProblemSolver test"));
  vi.stubGlobal("fetch", mocks.fetch);
  // Vitest does not load Tailwind; preserve the meaning of hidden pane wrappers.
  visibilityStyles = document.createElement("style");
  visibilityStyles.textContent = ".hidden { display: none; }";
  document.head.appendChild(visibilityStyles);
});

afterEach(() => {
  cleanup();
  visibilityStyles.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProblemSolver daily challenge", () => {
  it("renders the problem title, HTML description, difficulty, topics and source link", async () => {
    renderSolver();
    await loadedEditor();

    expect(screen.getByRole("heading", { name: "Two Sum" })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText("Easy", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("Hash Table", { exact: true })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open on leetcode/i })).toHaveAttribute(
      "href", "https://leetcode.com/problems/two-sum/",
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("provides the Daily challenge page heading", async () => {
    renderSolver();
    await loadedEditor();
    expect(await screen.findByRole("heading", { name: "Daily challenge" })).toBeVisible();
  });

  it("shows the acceptance rate from the daily response", async () => {
    renderSolver();
    await loadedEditor();

    // A rounded percentage, not one fixed presentation format.
    expect(screen.getByText(/56\.7\s*%/)).toBeInTheDocument();
  });

  it("expands and collapses both hints with an accessible count and state", async () => {
    renderSolver();
    await loadedEditor();
    const toggle = screen.getByRole("button", { name: /^hints\s*\(?2\)?$/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(HINTS[0])).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const hint of HINTS) {
      expect(await screen.findByText(hint)).toBeInTheDocument();
    }

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => {
      for (const hint of HINTS) expect(screen.queryByText(hint)).not.toBeInTheDocument();
    });
  });

  it("opens the editorial and returns to the description without changing code", async () => {
    renderSolver();
    const editor = await loadedEditor();
    fireEvent.change(editor, { target: { value: JAVA_DRAFT } });

    fireEvent.click(screen.getByRole("tab", { name: "Editorial" }));
    expect(screen.getByRole("tab", { name: "Editorial" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText(EDITORIAL)).toBeInTheDocument();
    expect(screen.queryByText(DESCRIPTION)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Description" }));
    expect(screen.getByRole("tab", { name: "Description" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText(DESCRIPTION)).toBeInTheDocument();
    expect(screen.queryByText(EDITORIAL)).not.toBeInTheDocument();
    expect(editor).toHaveValue(JAVA_DRAFT);
  });

  it("supports keyboard navigation from Description to Editorial", async () => {
    renderSolver();
    await loadedEditor();
    const description = screen.getByRole("tab", { name: "Description" });
    const editorial = screen.getByRole("tab", { name: "Editorial" });
    description.focus();

    fireEvent.keyDown(description, { key: "ArrowRight", code: "ArrowRight" });
    await waitFor(() => expect(editorial).toHaveFocus());
    fireEvent.keyDown(editorial, { key: "Enter", code: "Enter" });
    await waitFor(() => expect(editorial).toHaveAttribute("aria-selected", "true"));
    expect(await screen.findByText(EDITORIAL)).toBeInTheDocument();
  });

  it("opens Guru AI without contacting the assistant service and can return", async () => {
    renderSolver();
    await loadedEditor();
    fireEvent.click(screen.getByRole("tab", { name: "Guru AI" }));
    expect(await screen.findByRole("region", { name: "Guru assistant" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(await screen.findByText(DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Description" })).toHaveAttribute("aria-selected", "true");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("keeps All topics navigation working from the editorial", async () => {
    renderSolver();
    await loadedEditor();
    fireEvent.click(screen.getByRole("tab", { name: "Editorial" }));
    fireEvent.click(screen.getByRole("link", { name: "All topics" }));
    expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
  });

  it("waits for loading to finish before exposing the challenge and editor", async () => {
    mocks.dailyChallenge.mockReturnValue({ ...readyState(), data: undefined, isLoading: true });
    const view = renderSolver();
    expect(screen.queryByRole("heading", { name: "Two Sum" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Code editor" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();

    mocks.dailyChallenge.mockReturnValue(readyState());
    view.rerender(viewElement());
    await loadedEditor();
    expect(screen.getByRole("heading", { name: "Two Sum" })).toBeInTheDocument();
  });

  it("displays a load error and invokes refetch when Retry is clicked", async () => {
    mocks.dailyChallenge.mockReturnValue({
      ...readyState(), data: undefined, isError: true,
      error: new Error("Daily challenge service unavailable"),
    });
    const view = renderSolver();
    expect(screen.getByText("Daily challenge service unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Code editor" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }));
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    mocks.dailyChallenge.mockReturnValue(readyState());
    view.rerender(viewElement());
    await loadedEditor();
    expect(screen.queryByText("Daily challenge service unavailable")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two Sum" })).toBeInTheDocument();
  });
});

// Use the same router tree when a mocked query changes, preserving page state.
function viewElement() {
  return (
    <MemoryRouter
      initialEntries={["/problem-solver"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/problem-solver" element={<ProblemSolver />} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProblemSolver editor workspace", () => {
  it("exposes the Run code action", async () => {
    renderSolver();
    await loadedEditor();
    expect(screen.getByRole("button", { name: /^run code$/i })).toBeEnabled();
  });

  it("exposes Test cases and Results as console tabs", async () => {
    renderSolver();
    await loadedEditor();
    expect(screen.getByRole("tab", { name: "Test cases" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Results" })).toHaveAttribute("aria-selected", "false");
  });

  it("allows opening empty Results before running code and returning to Test cases", async () => {
    renderSolver();
    const editor = await loadedEditor();
    fireEvent.change(editor, { target: { value: JAVA_DRAFT } });
    const results = screen.getByRole("tab", { name: "Results" });

    expect(results).toBeEnabled();
    expect(results).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(results);
    expect(results).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Test cases" })).toHaveAttribute("aria-selected", "false");
    await waitFor(() => expect(screen.getByText("No results yet")).toBeVisible());
    expect(mocks.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("tab", { name: "Test cases" }));
    expect(screen.getByRole("tab", { name: "Test cases" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(screen.queryByText("No results yet")).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "Test case input" })).toHaveValue(FIRST_INPUT);
    expect(editor).toHaveValue(JAVA_DRAFT);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("restores an existing Java draft instead of replacing it with the starter", async () => {
    mocks.auth.mockReturnValue({ user: { id: "learner-1" } });
    mocks.readSavedCode.mockResolvedValue({ data: { code: JAVA_DRAFT }, error: null });
    renderSolver();
    const editor = await loadedEditor(JAVA_DRAFT);
    expect(editor).toHaveValue(JAVA_DRAFT);
    expect(mocks.from).toHaveBeenCalledWith("daily_challenge_user_code");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("mounts both compact panes initially and hides only the inactive wrapper", async () => {
    mocks.mediaQuery.mockReturnValue(true);
    renderSolver();
    const title = screen.getByRole("heading", { name: "Two Sum" });
    await waitFor(() => expect(title).toBeVisible());
    // Label queries include hidden controls: the initial editor must already exist.
    const editor = screen.getByLabelText("Code editor");
    await waitFor(() => expect((editor as HTMLTextAreaElement).value).toContain(JAVA_STARTER));
    expect(editor).not.toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Code editor" })).not.toBeInTheDocument();

    switchCompactPane("Editor");
    expect(title).toBeInTheDocument();
    expect(title).not.toBeVisible();
    expect(screen.queryByRole("heading", { name: "Two Sum" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Code editor" })).toBe(editor);
    await waitFor(() => expect(editor).toBeVisible());

    switchCompactPane("Problem");
    expect(screen.getByRole("heading", { name: "Two Sum" })).toBe(title);
    expect(title).toBeVisible();
    expect(editor).toBeInTheDocument();
    expect(editor).not.toBeVisible();
  });

  it("keeps the compact editor mounted and preserves unsaved Java across pane switches", async () => {
    const editor = await openCompactEditor();
    fireEvent.change(editor, { target: { value: JAVA_DRAFT } });

    switchCompactPane("Problem");
    // A saved-and-restored value is insufficient: Monaco must not be disposed.
    expect(editor).toBeInTheDocument();
    expect(editor).not.toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Code editor" })).not.toBeInTheDocument();
    switchCompactPane("Editor");
    expect(screen.getByRole("textbox", { name: "Code editor" })).toBe(editor);
    expect(editor).toHaveValue(JAVA_DRAFT);
    await waitFor(() => expect(editor).toBeVisible());
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("preserves helper files and their active draft across compact pane switches", async () => {
    const editor = await openCompactEditor();
    fireEvent.change(editor, { target: { value: JAVA_DRAFT } });
    fireEvent.click(screen.getByRole("button", { name: /^add file$/i }));
    fireEvent.change(editor, { target: { value: HELPER_DRAFT } });
    expect(screen.getByText("Helper1.java", { exact: true })).toBeInTheDocument();

    switchCompactPane("Problem");
    switchCompactPane("Editor");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Code editor" })).toHaveValue(HELPER_DRAFT));
    fireEvent.click(screen.getByText("Solution.java", { exact: true }));
    expect(screen.getByRole("textbox", { name: "Code editor" })).toHaveValue(JAVA_DRAFT);
    fireEvent.click(screen.getByText("Helper1.java", { exact: true }));
    expect(screen.getByRole("textbox", { name: "Code editor" })).toHaveValue(HELPER_DRAFT);
  });

  it("preserves added test cases and edited input across compact pane switches", async () => {
    await openCompactEditor();
    expect(screen.getByRole("textbox", { name: "Test case input" })).toHaveValue(FIRST_INPUT);
    fireEvent.click(screen.getByRole("button", { name: /add (?:new|custom) testcase/i }));
    fireEvent.change(screen.getByRole("textbox", { name: "Test case input" }), {
      target: { value: CUSTOM_INPUT },
    });

    switchCompactPane("Problem");
    switchCompactPane("Editor");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Test case input" })).toHaveValue(CUSTOM_INPUT));
    expect(screen.getByText("Case 3", { exact: true })).toBeInTheDocument();
  });

  it("preserves completed execution results across compact pane switches without rerunning", async () => {
    const editor = await openCompactEditor();
    fireEvent.change(editor, { target: { value: JAVA_DRAFT } });
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ program_output: "[0,1]\n[1,2]\n" }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Run code" }));
    expect(await screen.findByText("Tests passed", { exact: true })).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    const request = JSON.parse(mocks.fetch.mock.calls[0][1].body as string);
    expect(request.code).toContain(JAVA_DRAFT);

    switchCompactPane("Problem");
    switchCompactPane("Editor");
    expect(await screen.findByText("Tests passed", { exact: true })).toBeInTheDocument();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
