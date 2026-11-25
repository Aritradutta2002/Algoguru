import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CP_TEMPLATES } from "@/data/cpTemplates";
import { TooltipProvider } from "@/components/ui/tooltip";
import { resetNextNavigationMocks } from "@/test/nextNavigationMock";
import { PlaygroundWorkspace } from "./PlaygroundWorkspace";

const editorHarness = vi.hoisted(() => ({
  revealPositionInCenter: vi.fn(),
  setPosition: vi.fn(),
  focus: vi.fn(),
}));

const authHarness = vi.hoisted(() => ({
  user: null as { id: string } | null,
}));

const supabaseHarness = vi.hoisted(() => ({
  from: vi.fn(),
}));

const toastHarness = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import("@/test/nextNavigationMock");
  return createNextNavigationMock();
});

vi.mock("next/dynamic", async () => {
  const React = await import("react");
  const disposable = { dispose: vi.fn() };
  const model = { updateOptions: vi.fn() };
  const editor = {
    updateOptions: vi.fn(),
    getModel: vi.fn(() => model),
    onDidChangeCursorPosition: vi.fn(() => disposable),
    onDidChangeCursorSelection: vi.fn(() => disposable),
    onMouseDown: vi.fn(() => disposable),
    onDidDispose: vi.fn(() => disposable),
    addCommand: vi.fn(),
    deltaDecorations: vi.fn(() => []),
    revealPositionInCenter: editorHarness.revealPositionInCenter,
    setPosition: editorHarness.setPosition,
    focus: editorHarness.focus,
  };
  const monaco = {
    editor: {
      defineTheme: vi.fn(),
      setTheme: vi.fn(),
      setModelMarkers: vi.fn(),
      MouseTargetType: {
        GUTTER_LINE_NUMBERS: 2,
        GUTTER_GLYPH_MARGIN: 3,
      },
      OverviewRulerLane: { Left: 1 },
    },
    KeyMod: { CtrlCmd: 2048, Shift: 1024, Alt: 512 },
    KeyCode: { Enter: 3, KeyF: 36, KeyP: 41, KeyG: 34 },
  };

  return {
    default: () => function MockMonacoEditor({
      value,
      onChange,
      onMount,
    }: {
      value: string;
      onChange: (value: string | undefined) => void;
      onMount?: (editor: unknown, monaco: unknown) => void;
    }) {
      const onMountRef = React.useRef(onMount);
      onMountRef.current = onMount;

      React.useEffect(() => {
        onMountRef.current?.(editor, monaco);
      }, []);

      return (
        <textarea
          aria-label="Playground editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    },
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authHarness.user }),
}));

vi.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({ theme: "dark" }),
}));

vi.mock("@/hooks/useCPTemplates", () => ({
  useCPTemplates: () => ({ templates: [], loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: supabaseHarness.from },
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: toastHarness.toast }),
}));

vi.mock("@/lib/playground/registerJavaLanguage", () => ({
  registerPlaygroundJavaLanguage: vi.fn(),
}));

const savedUserTemplate = {
  id: "saved-template-1",
  user_id: "user-1",
  name: "Saved BFS Template",
  description: "Breadth-first search",
  code: "class Main { /* BFS */ }",
  created_at: "2026-01-01T00:00:00.000Z",
};

type SupabaseQueryError = {
  message: string;
  details: null;
  hint: null;
  code: string;
  name: string;
};

type SupabaseQueryResult = { data: unknown; error: SupabaseQueryError | null };

type SupabaseQueryMock = PromiseLike<SupabaseQueryResult> & {
  execute: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function createSupabaseQuery(data: unknown): SupabaseQueryMock {
  const result: SupabaseQueryResult = { data, error: null };
  const execute = vi.fn(() => Promise.resolve(result));
  const query: SupabaseQueryMock = {
    execute,
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    single: vi.fn(() => query),
    upsert: vi.fn(() => query),
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    delete: vi.fn(() => query),
    then(onfulfilled, onrejected) {
      return execute().then(onfulfilled, onrejected);
    },
  };
  return query;
}

function mockSupabaseTables(
  userTemplates: unknown[],
  templateOverrides: unknown[] = [],
) {
  const tables: Record<string, SupabaseQueryMock> = {
    playground_user_templates: createSupabaseQuery(userTemplates),
    playground_template_overrides: createSupabaseQuery(templateOverrides),
    playground_preferences: createSupabaseQuery(null),
    playground_workspace: createSupabaseQuery(null),
    practice_problem_user_state: createSupabaseQuery(null),
  };

  supabaseHarness.from.mockImplementation((table: string) => {
    const query = tables[table];
    if (!query) throw new Error(`Unexpected Supabase table: ${table}`);
    return query;
  });
  return tables;
}

const persistenceError: SupabaseQueryError = {
  message: "Cloud mutation failed",
  details: null,
  hint: null,
  code: "PGRST999",
  name: "PostgrestError",
};

function failNextMutation(query: SupabaseQueryMock) {
  query.execute.mockClear();
  query.execute.mockResolvedValueOnce({ data: null, error: persistenceError });
}

function createDeferredQueryResult() {
  let resolve!: (result: SupabaseQueryResult) => void;
  const promise = new Promise<SupabaseQueryResult>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function startAndQueuePreferenceWrites(preferences: SupabaseQueryMock) {
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const dialog = await screen.findByRole("dialog", { name: "Settings" });
  const toggle = within(dialog).getByRole("switch", {
    name: "Relative line numbers",
  });

  fireEvent.click(toggle);
  preferences.execute.mockClear();
  preferences.upsert.mockClear();
  const deferred = createDeferredQueryResult();
  preferences.execute.mockReturnValueOnce(deferred.promise);

  await waitFor(() => {
    expect(preferences.execute).toHaveBeenCalledTimes(1);
  }, { timeout: 2000 });

  fireEvent.click(toggle);
  fireEvent.click(within(dialog).getByRole("button", { name: "Close settings" }));
  await waitFor(() => {
    expect(
      screen.queryByRole("dialog", { name: "Settings" }),
    ).not.toBeInTheDocument();
  });
  await act(async () => {
    await Promise.resolve();
  });

  return { deferred };
}

const propertyRestorers: Array<() => void> = [];

function stubProperty(target: object, property: string, descriptor: PropertyDescriptor) {
  const original = Object.getOwnPropertyDescriptor(target, property);
  Object.defineProperty(target, property, { ...descriptor, configurable: true });
  propertyRestorers.push(() => {
    if (original) Object.defineProperty(target, property, original);
    else Reflect.deleteProperty(target, property);
  });
}

function renderWorkspace() {
  return render(
    <TooltipProvider>
      <PlaygroundWorkspace />
    </TooltipProvider>,
  );
}

async function openCreateTemplateDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Templates" }));
  const templatesDialog = await screen.findByRole("dialog", { name: "Templates" });
  fireEvent.click(
    within(templatesDialog).getByRole("button", {
      name: "Save current code as template",
    }),
  );
  return screen.findByRole("dialog", { name: "Save as Template" });
}

beforeEach(() => {
  localStorage.clear();
  authHarness.user = null;
  vi.clearAllMocks();
  supabaseHarness.from.mockReset();
  resetNextNavigationMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  propertyRestorers.splice(0).reverse().forEach((restore) => restore());
});

describe("PlaygroundWorkspace overlays", () => {
  it("exposes languages as menu radios and resets code after keyboard selection", async () => {
    renderWorkspace();
    const editor = screen.getByRole("textbox", { name: "Playground editor" });
    const trigger = screen.getByRole("button", { name: "Change Language" });

    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const menu = await screen.findByRole("menu");
    const java = within(menu).getByRole("menuitemradio", { name: /Java/ });
    const python = within(menu).getByRole("menuitemradio", { name: /Python/ });
    expect(java).toHaveAttribute("aria-checked", "true");
    expect(python).toHaveAttribute("aria-checked", "false");
    expect(java).toHaveTextContent("openjdk-jdk-21+35");
    expect(python).toHaveTextContent("cpython-3.14.0");

    await waitFor(() => expect(java).toHaveFocus());
    fireEvent.keyDown(java, { key: "ArrowDown" });
    await waitFor(() => expect(python).toHaveFocus());
    fireEvent.keyDown(python, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(editor).toHaveValue('print("Hello, World!")');
      expect(trigger).toHaveTextContent("Python");
      expect(trigger).toHaveFocus();
    });
  });

  it.each([
    {
      label: "Editor theme",
      initialOption: "Sync with App",
      option: "VS Dark",
    },
    { label: "Font size", initialOption: "14px", option: "16px" },
  ])("portals and keyboard-selects the $label Select outside Settings", async ({
    label,
    initialOption,
    option,
  }) => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    const trigger = within(dialog).getByRole("combobox", { name: label });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const listbox = await screen.findByRole("listbox");
    expect(dialog).not.toContainElement(listbox);
    expect(listbox).toHaveClass("playground-shell", "z-[10000]");

    let focusedOption = within(listbox).getByRole("option", {
      name: initialOption,
    });
    await waitFor(() => expect(focusedOption).toHaveFocus());

    const optionNames = within(listbox)
      .getAllByRole("option")
      .map((item) => item.textContent?.trim());
    const targetIndex = optionNames.indexOf(option);
    const initialIndex = optionNames.indexOf(initialOption);
    for (let index = initialIndex + 1; index <= targetIndex; index += 1) {
      fireEvent.keyDown(focusedOption, { key: "ArrowDown" });
      focusedOption = within(listbox).getAllByRole("option")[index];
      await waitFor(() => expect(focusedOption).toHaveFocus());
    }

    fireEvent.keyDown(focusedOption, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(trigger).toHaveTextContent(option);
      expect(trigger).toHaveFocus();
    });
  });

  it("keeps body-portaled overlays inside native fullscreen", async () => {
    let fullscreenElement: Element | null = null;
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    stubProperty(document, "fullscreenEnabled", { value: true });
    stubProperty(document, "fullscreenElement", {
      get: () => fullscreenElement,
    });
    stubProperty(document, "exitFullscreen", { value: exitFullscreen });
    stubProperty(document.documentElement, "requestFullscreen", {
      value: requestFullscreen,
    });

    renderWorkspace();
    const fullscreenButton = screen.getByRole("button", {
      name: "Toggle fullscreen",
    });
    fireEvent.click(fullscreenButton);

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(fullscreenElement).toBe(document.documentElement);

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(dialog.parentElement).toBe(document.body);
    expect(document.fullscreenElement).toContainElement(dialog);

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });
    fireEvent.click(fullscreenButton);

    await waitFor(() => {
      expect(exitFullscreen).toHaveBeenCalledTimes(1);
      expect(fullscreenElement).toBeNull();
      expect(fullscreenButton.querySelector(".lucide-maximize")).toBeInTheDocument();
    });
  });

  it("names Settings, updates a toggle, persists on Escape, and restores trigger focus", async () => {
    renderWorkspace();
    const trigger = screen.getByRole("button", { name: "Settings" });

    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    const toggle = within(dialog).getByRole("switch", {
      name: "Relative line numbers",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const minimap = within(dialog).getByRole("switch", {
      name: "Toggle minimap",
    });
    fireEvent.click(minimap);
    expect(minimap).toHaveAttribute("aria-checked", "false");

    const wordWrap = within(dialog).getByRole("switch", {
      name: "Toggle word wrap",
    });
    fireEvent.click(wordWrap);
    expect(wordWrap).toHaveAttribute("aria-checked", "false");

    localStorage.removeItem("algoguru.playground.editor_options");
    expect(localStorage.getItem("algoguru.playground.editor_options")).toBeNull();

    fireEvent.keyDown(toggle, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
    expect(
      JSON.parse(
        localStorage.getItem("algoguru.playground.editor_options") || "{}",
      ),
    ).toEqual({
      minimap: false,
      wordWrap: false,
      cursorSmooth: false,
      bracketPairColorization: true,
      formatOnType: false,
    });
  });

  it("names Templates and loads a standard template into the editor", async () => {
    renderWorkspace();
    const editor = screen.getByRole("textbox", { name: "Playground editor" });
    const trigger = screen.getByRole("button", { name: "Templates" });

    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    const codeforcesButton = within(dialog).getByRole("button", {
      name: /^Codeforces/,
    });
    expect(codeforcesButton.nextElementSibling).toHaveClass(
      "opacity-100",
      "[@media(hover:hover)]:opacity-0",
      "[@media(hover:hover)]:group-hover:opacity-100",
      "[@media(hover:hover)]:group-focus-within:opacity-100",
    );
    fireEvent.click(codeforcesButton);

    const codeforces = CP_TEMPLATES.find(
      (template) => template.prefix === "codeforces",
    );
    expect(codeforces).toBeDefined();
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Templates" }),
      ).not.toBeInTheDocument();
      expect(editor).toHaveValue(codeforces?.code);
      expect(trigger).toHaveFocus();
    });
  });

  it("keeps the template editor above the exiting Templates overlay", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));

    const templatesDialog = await screen.findByRole("dialog", {
      name: "Templates",
    });
    fireEvent.click(
      within(templatesDialog).getByRole("button", {
        name: "Save current code as template",
      }),
    );

    const templateDialog = await screen.findByRole("dialog", {
      name: "Save as Template",
    });
    expect(templateDialog).toHaveClass("z-[9999]");
    expect(templateDialog.previousElementSibling).toHaveClass(
      "fixed",
      "inset-0",
      "z-[9999]",
    );
  });

  it.each(["Save", "Cancel", "Escape"])(
    "restores Templates trigger focus when the template editor closes via %s",
    async (closeAction) => {
      renderWorkspace();
      const trigger = screen.getByRole("button", { name: "Templates" });
      fireEvent.click(trigger);
      const templatesDialog = await screen.findByRole("dialog", {
        name: "Templates",
      });
      fireEvent.click(
        within(templatesDialog).getByRole("button", {
          name: "Save current code as template",
        }),
      );

      const templateDialog = await screen.findByRole("dialog", {
        name: "Save as Template",
      });
      const nameInput = within(templateDialog).getByLabelText(/Template Name/);
      fireEvent.change(nameInput, { target: { value: "Focus Template" } });
      if (closeAction === "Escape") {
        fireEvent.keyDown(nameInput, { key: "Escape" });
      } else {
        fireEvent.click(
          within(templateDialog).getByRole("button", { name: closeAction }),
        );
      }

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Save as Template" }),
        ).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      });
    },
  );

  it("bounds the template editor and scrolls only its form body", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const templatesDialog = await screen.findByRole("dialog", {
      name: "Templates",
    });
    fireEvent.click(
      within(templatesDialog).getByRole("button", {
        name: "Save current code as template",
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Save as Template",
    });
    const header = within(dialog).getByRole("heading", {
      name: "Save as Template",
    }).parentElement;
    const body = within(dialog)
      .getByText("The current editor code will be saved with this template.")
      .parentElement;
    const footer = within(dialog).getByRole("button", { name: "Cancel" }).parentElement;

    expect(dialog).toHaveClass("flex", "flex-col", "max-h-[85vh]", "overflow-hidden");
    expect(header).toHaveClass("shrink-0");
    expect(body).toHaveClass("min-h-0", "flex-1", "overflow-y-auto");
    expect(footer).toHaveClass("shrink-0");
  });

  it("shows saved-template actions on touch/focus and opens the edit handoff", async () => {
    authHarness.user = { id: "user-1" };
    mockSupabaseTables([savedUserTemplate]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));

    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    const templateButton = within(dialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const row = templateButton.parentElement;
    expect(row).not.toBeNull();
    const editButton = within(row as HTMLElement).getByRole("button", {
      name: "Edit template",
    });
    expect(editButton.parentElement).toHaveClass(
      "opacity-100",
      "[@media(hover:hover)]:opacity-0",
      "[@media(hover:hover)]:group-hover:opacity-100",
      "[@media(hover:hover)]:group-focus-within:opacity-100",
    );

    fireEvent.click(editButton);

    const editDialog = await screen.findByRole("dialog", {
      name: "Edit Template",
    });
    expect(within(editDialog).getByLabelText(/Template Name/)).toHaveValue(
      "Saved BFS Template",
    );
    expect(
      within(editDialog).getByLabelText("Description (optional)"),
    ).toHaveValue("Breadth-first search");
  });

  it("requires a second Delete template click before removing a saved template", async () => {
    authHarness.user = { id: "user-1" };
    mockSupabaseTables([savedUserTemplate]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));

    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    const templateButton = within(dialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const row = templateButton.parentElement;
    expect(row).not.toBeNull();
    const deleteButton = within(row as HTMLElement).getByRole("button", {
      name: "Delete template",
    });

    fireEvent.click(deleteButton);
    expect(templateButton).toBeInTheDocument();
    fireEvent.focus(deleteButton);
    expect(
      await screen.findByRole("tooltip", {
        name: "Click again to confirm delete",
      }),
    ).toBeInTheDocument();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(
        within(dialog).queryByRole("button", { name: /Saved BFS Template/ }),
      ).not.toBeInTheDocument();
      expect(within(dialog).queryByText("My templates")).not.toBeInTheDocument();
    });
  });

  it("disarms template deletion when Templates closes and reopens", async () => {
    authHarness.user = { id: "user-1" };
    mockSupabaseTables([savedUserTemplate]);
    renderWorkspace();
    const trigger = screen.getByRole("button", { name: "Templates" });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    const templateButton = within(dialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const deleteButton = within(templateButton.parentElement as HTMLElement).getByRole(
      "button",
      { name: "Delete template" },
    );
    fireEvent.click(deleteButton);
    expect(deleteButton.querySelector(".lucide-check")).toBeInTheDocument();

    fireEvent.focus(deleteButton);
    fireEvent.keyDown(deleteButton, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Templates" }),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(trigger);
    const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
    const reopenedTemplate = within(reopenedDialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const reopenedDelete = within(
      reopenedTemplate.parentElement as HTMLElement,
    ).getByRole("button", { name: "Delete template" });
    expect(reopenedDelete.querySelector(".lucide-check")).not.toBeInTheDocument();

    fireEvent.click(reopenedDelete);
    expect(reopenedTemplate).toBeInTheDocument();
  });

  it("expires template delete confirmation after three seconds", async () => {
    authHarness.user = { id: "user-1" };
    mockSupabaseTables([savedUserTemplate]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));

    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    const templateButton = within(dialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const deleteButton = within(templateButton.parentElement as HTMLElement).getByRole(
      "button",
      { name: "Delete template" },
    );

    vi.useFakeTimers();
    try {
      fireEvent.click(deleteButton);
      expect(deleteButton.querySelector(".lucide-check")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(deleteButton.querySelector(".lucide-check")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(deleteButton.querySelector(".lucide-check")).not.toBeInTheDocument();

      fireEvent.click(deleteButton);
      expect(templateButton).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("names the Outline sheet, jumps to the symbol position, closes, and restores focus", async () => {
    renderWorkspace();
    const trigger = screen.getByRole("button", { name: "Toggle outline" });

    fireEvent.click(trigger);

    const sheet = await screen.findByRole("dialog", { name: "Outline" });
    expect(sheet).toHaveClass("flex", "flex-col");
    const mainClass = await within(sheet).findByRole("button", {
      name: /class Main/,
    });
    expect(mainClass.closest(".overflow-auto")).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-auto",
    );
    fireEvent.click(mainClass);

    expect(editorHarness.revealPositionInCenter).toHaveBeenCalledWith({
      lineNumber: 1,
      column: 14,
    });
    expect(editorHarness.setPosition).toHaveBeenCalledWith({
      lineNumber: 1,
      column: 14,
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Outline" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});

describe("PlaygroundWorkspace cloud persistence", () => {
  it("discards user A notes, templates, and tabs on account switch without autosaving them for user B", async () => {
    authHarness.user = { id: "user-a" };
    const userATab = {
      id: "user-a-tab",
      title: "User A tab",
      code: "// User A code",
    };
    const userATabs = [
      {
        id: "solution",
        title: "Solution",
        code: "// User A solution",
        protected: true,
      },
      userATab,
    ];
    const tablesA = mockSupabaseTables([{
      ...savedUserTemplate,
      user_id: "user-a",
      id: "user-a-template",
      name: "User A template",
      code: "// User A template",
    }]);
    tablesA.practice_problem_user_state.execute.mockResolvedValueOnce({
      data: { notes: "User A private note" },
      error: null,
    });
    tablesA.playground_workspace.execute.mockResolvedValueOnce({
      data: { tabs: userATabs, active_tab_id: userATab.id },
      error: null,
    });

    const view = renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Open Notes" }));
    const notesEditor = await screen.findByPlaceholderText(
      "Type here...(Markdown is enabled)",
    );
    await waitFor(() => {
      expect(notesEditor).toHaveValue("User A private note");
    });

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const templatesDialog = await screen.findByRole("dialog", {
      name: "Templates",
    });
    expect(
      within(templatesDialog).getByRole("button", { name: /User A template/ }),
    ).toBeInTheDocument();
    fireEvent.keyDown(templatesDialog, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Templates" }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Switch to User A tab" }),
    ).toBeInTheDocument();

    const createPendingQuery = () => {
      const query = createSupabaseQuery(null);
      const deferred = createDeferredQueryResult();
      query.execute.mockReturnValueOnce(deferred.promise);
      return { query, resolve: deferred.resolve };
    };
    const notesB = createPendingQuery();
    const workspaceB = createPendingQuery();
    const templatesB = createPendingQuery();
    const overridesB = createPendingQuery();
    const tablesB: Record<string, SupabaseQueryMock> = {
      practice_problem_user_state: notesB.query,
      playground_workspace: workspaceB.query,
      playground_user_templates: templatesB.query,
      playground_template_overrides: overridesB.query,
      playground_preferences: createSupabaseQuery(null),
    };
    supabaseHarness.from.mockImplementation((table: string) => {
      const query = tablesB[table];
      if (!query) throw new Error(`Unexpected Supabase table: ${table}`);
      return query;
    });

    authHarness.user = { id: "user-b" };
    view.rerender(
      <TooltipProvider>
        <PlaygroundWorkspace />
      </TooltipProvider>,
    );

    expect(
      screen.queryByDisplayValue("User A private note"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Switch to User A tab" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const templatesDialogB = await screen.findByRole("dialog", {
      name: "Templates",
    });
    expect(
      within(templatesDialogB).queryByRole("button", {
        name: /User A template/,
      }),
    ).not.toBeInTheDocument();

    await act(async () => {
      notesB.resolve({ data: null, error: null });
      workspaceB.resolve({ data: null, error: null });
      templatesB.resolve({ data: [], error: null });
      overridesB.resolve({ data: [], error: null });
    });
    fireEvent.keyDown(templatesDialogB, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Templates" }),
      ).not.toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });

    expect(tablesB.practice_problem_user_state.upsert).not.toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-b",
        notes: "User A private note",
      }),
    );
    expect(tablesB.playground_user_templates.upsert).not.toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-b", name: "User A template" }),
    );
    const workspaceWrites = tablesB.playground_workspace.upsert.mock.calls.map(
      ([payload]) => payload as { user_id: string; tabs: Array<{ title: string }> },
    );
    expect(
      workspaceWrites.some(
        (payload) =>
          payload.user_id === "user-b" &&
          payload.tabs.some((tab) => tab.title === "User A tab"),
      ),
    ).toBe(false);
  });

  it.each([
    { resource: "notes", table: "practice_problem_user_state" },
    { resource: "preferences", table: "playground_preferences" },
    { resource: "workspace", table: "playground_workspace" },
  ])("does not autosave after a failed $resource read", async ({ resource, table }) => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    failNextMutation(tables[table]);
    renderWorkspace();

    await waitFor(() => {
      expect(tables[table].execute).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    if (resource === "notes") {
      fireEvent.click(screen.getByRole("button", { name: "Open Notes" }));
      const notesEditor = await screen.findByPlaceholderText(
        "Type here...(Markdown is enabled)",
      );
      fireEvent.change(notesEditor, {
        target: { value: "Draft after failed notes read" },
      });
    } else if (resource === "workspace") {
      fireEvent.change(
        screen.getByRole("textbox", { name: "Playground editor" }),
        { target: { value: "// Draft after failed workspace read" } },
      );
    } else {
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Settings" }));
      const dialog = await screen.findByRole("dialog", { name: "Settings" });
      fireEvent.click(within(dialog).getByRole("switch", {
        name: "Relative line numbers",
      }));
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Close settings" }),
      );
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Settings" }),
        ).not.toBeInTheDocument();
      });
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });

    expect(tables[table].execute).toHaveBeenCalledTimes(1);
    expect(tables[table].upsert).not.toHaveBeenCalled();
  });

  it("executes close-together preference writes serially in schedule order", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });

    const { deferred } = await startAndQueuePreferenceWrites(
      tables.playground_preferences,
    );

    expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    expect(tables.playground_preferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", relative_lines: true }),
    );

    await act(async () => {
      deferred.resolve({ data: null, error: null });
    });
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(2);
    });
    expect(
      tables.playground_preferences.upsert.mock.calls.map(
        ([payload]) => payload.relative_lines,
      ),
    ).toEqual([true, false]);
  });

  it("drops a queued preference write when its workspace unmounts", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const view = renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });

    const { deferred } = await startAndQueuePreferenceWrites(
      tables.playground_preferences,
    );
    expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);

    view.unmount();
    await act(async () => {
      deferred.resolve({ data: null, error: null });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
  });

  it("awaits and reports a failed preference upsert when Settings closes", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    failNextMutation(tables.playground_preferences);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close settings" }));

    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });

  it("awaits and reports a failed debounced preference upsert", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    }, { timeout: 2000 });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    failNextMutation(tables.playground_preferences);
    fireEvent.click(within(dialog).getByRole("switch", {
      name: "Relative line numbers",
    }));

    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    }, { timeout: 2000 });
  });

  it.each(["built-in", "saved"])(
    "keeps the %s template editor and local state unchanged when its update fails",
    async (kind) => {
      authHarness.user = { id: "user-1" };
      const tables = mockSupabaseTables([savedUserTemplate]);
      renderWorkspace();
      fireEvent.click(screen.getByRole("button", { name: "Templates" }));
      const templatesDialog = await screen.findByRole("dialog", {
        name: "Templates",
      });
      await waitFor(() => {
        expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
        expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
      });

      const query = kind === "built-in"
        ? tables.playground_template_overrides
        : tables.playground_user_templates;
      failNextMutation(query);
      let templateDialog: HTMLElement;
      let templateDialogName: string;
      if (kind === "built-in") {
        const templateButton = within(templatesDialog).getByRole("button", {
          name: /^Codeforces/,
        });
        fireEvent.click(within(templateButton.parentElement as HTMLElement).getByRole(
          "button",
          { name: "Edit template" },
        ));
        templateDialogName = "Edit Built-in Template";
        templateDialog = await screen.findByRole("dialog", {
          name: templateDialogName,
        });
      } else {
        const templateButton = within(templatesDialog).getByRole("button", {
          name: /Saved BFS Template/,
        });
        fireEvent.click(within(templateButton.parentElement as HTMLElement).getByRole(
          "button",
          { name: "Edit template" },
        ));
        templateDialogName = "Edit Template";
        templateDialog = await screen.findByRole("dialog", {
          name: templateDialogName,
        });
        fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
          target: { value: "Renamed BFS Template" },
        });
      }

      fireEvent.click(within(templateDialog).getByRole("button", { name: "Update" }));
      expect(templateDialog).toBeInTheDocument();
      await waitFor(() => {
        expect(query.execute).toHaveBeenCalledTimes(1);
        expect(toastHarness.toast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: "destructive" }),
        );
      });

      fireEvent.click(within(templateDialog).getByRole("button", { name: "Cancel" }));
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: templateDialogName }),
        ).not.toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Templates" }));
      const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
      if (kind === "built-in") {
        expect(within(reopenedDialog).queryByText("edited")).not.toBeInTheDocument();
      } else {
        expect(within(reopenedDialog).getByRole("button", {
          name: /Saved BFS Template/,
        })).toBeInTheDocument();
        expect(within(reopenedDialog).queryByRole("button", {
          name: /Renamed BFS Template/,
        })).not.toBeInTheDocument();
      }
    },
  );

  it("issues one insert when Save is double-submitted before pending state renders", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const deferred = createDeferredQueryResult();
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "Double Submit Template" },
    });
    tables.playground_user_templates.execute.mockClear();
    tables.playground_user_templates.execute.mockReturnValueOnce(deferred.promise);
    const saveButton = within(templateDialog).getByRole("button", { name: "Save" });

    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      saveButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
    await act(async () => {
      deferred.resolve({ data: null, error: null });
      await deferred.promise;
    });

    expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    expect(tables.playground_user_templates.insert).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });
  });

  it("disables Save and Cancel and keeps the editor open while a save is pending", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const deferred = createDeferredQueryResult();
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    const nameInput = within(templateDialog).getByLabelText(/Template Name/);
    fireEvent.change(nameInput, {
      target: { value: "Pending Controls Template" },
    });
    tables.playground_user_templates.execute.mockClear();
    tables.playground_user_templates.execute.mockReturnValueOnce(deferred.promise);
    const saveButton = within(templateDialog).getByRole("button", { name: "Save" });
    const cancelButton = within(templateDialog).getByRole("button", { name: "Cancel" });

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(saveButton).toHaveAttribute("aria-busy", "true");
    fireEvent.click(cancelButton);
    fireEvent.keyDown(nameInput, { key: "Escape" });
    expect(templateDialog).toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ data: null, error: null });
      await deferred.promise;
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });
  });

  it("reuses the generated UUID in the insert payload when retrying a failed save", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "Stable ID Template" },
    });
    const firstId = "11111111-1111-4111-8111-111111111111";
    const secondId = "22222222-2222-4222-8222-222222222222";
    const randomUUID = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce(firstId)
      .mockReturnValueOnce(secondId);
    const saveButton = within(templateDialog).getByRole("button", { name: "Save" });
    failNextMutation(tables.playground_user_templates);

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(2);
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });

    expect(
      tables.playground_user_templates.insert.mock.calls.map(
        ([payload]) => payload.id,
      ),
    ).toEqual([firstId, firstId]);
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("preserves templates loaded while an insert is pending", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const unrelatedTemplate = {
      ...savedUserTemplate,
      id: "unrelated-template",
      name: "Unrelated Loaded Template",
    };
    const pendingLoad = createDeferredQueryResult();
    const pendingInsert = createDeferredQueryResult();
    tables.playground_user_templates.execute
      .mockReturnValueOnce(pendingLoad.promise)
      .mockReturnValueOnce(pendingInsert.promise);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "New Template During Load" },
    });

    fireEvent.click(within(templateDialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(2);
    });
    await act(async () => {
      pendingLoad.resolve({ data: [unrelatedTemplate], error: null });
      await pendingLoad.promise;
    });
    await act(async () => {
      pendingInsert.resolve({ data: null, error: null });
      await pendingInsert.promise;
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
    expect(
      within(reopenedDialog).getByRole("button", {
        name: /Unrelated Loaded Template/,
      }),
    ).toBeInTheDocument();
    expect(
      within(reopenedDialog).getByRole("button", {
        name: /New Template During Load/,
      }),
    ).toBeInTheDocument();
  });

  it("allows one built-in reset at a time and marks its control pending", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([], [{
      user_id: "user-1",
      prefix: "codeforces",
      code: "class Main { /* custom */ }",
      description: "Custom Codeforces template",
    }]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    await waitFor(() => {
      expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
    });
    const templateButton = within(dialog).getByRole("button", { name: /^Codeforces/ });
    const resetButton = within(templateButton.parentElement as HTMLElement).getByRole(
      "button",
      { name: "Reset to original" },
    );
    const deferred = createDeferredQueryResult();
    tables.playground_template_overrides.execute.mockClear();
    tables.playground_template_overrides.execute.mockReturnValueOnce(deferred.promise);

    await act(async () => {
      resetButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      resetButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
    expect(resetButton).toBeDisabled();
    expect(resetButton).toHaveAttribute("aria-busy", "true");
    expect(within(dialog).getByText("edited")).toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ data: null, error: null });
      await deferred.promise;
    });
    await waitFor(() => {
      expect(within(dialog).queryByText("edited")).not.toBeInTheDocument();
    });
  });

  it("keeps a pending insert open and does not add it when persistence fails", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const deferred = createDeferredQueryResult();
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const templatesDialog = await screen.findByRole("dialog", { name: "Templates" });
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(within(templatesDialog).getByRole("button", {
      name: "Save current code as template",
    }));
    const templateDialog = await screen.findByRole("dialog", {
      name: "Save as Template",
    });
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "Pending Cloud Template" },
    });
    tables.playground_user_templates.execute.mockClear();
    tables.playground_user_templates.execute.mockReturnValueOnce(deferred.promise);

    fireEvent.click(within(templateDialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    expect(templateDialog).toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ data: null, error: persistenceError });
    });
    await waitFor(() => {
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
    expect(templateDialog).toBeInTheDocument();

    fireEvent.click(within(templateDialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
    expect(within(reopenedDialog).queryByRole("button", {
      name: "Pending Cloud Template",
    })).not.toBeInTheDocument();
  });

  it("keeps a built-in override when its delete fails", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([], [{
      user_id: "user-1",
      prefix: "codeforces",
      code: "class Main { /* custom */ }",
      description: "Custom Codeforces template",
    }]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    await waitFor(() => {
      expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
    });
    const templateButton = within(dialog).getByRole("button", { name: /^Codeforces/ });
    const row = templateButton.parentElement as HTMLElement;
    expect(within(row).getByText("edited")).toBeInTheDocument();
    failNextMutation(tables.playground_template_overrides);

    fireEvent.click(within(row).getByRole("button", { name: "Reset to original" }));
    expect(within(dialog).getByText("edited")).toBeInTheDocument();
    await waitFor(() => {
      expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
  });

  it("keeps a saved template and disarms confirmation when its delete fails", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([savedUserTemplate]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const dialog = await screen.findByRole("dialog", { name: "Templates" });
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateButton = within(dialog).getByRole("button", {
      name: /Saved BFS Template/,
    });
    const deleteButton = within(templateButton.parentElement as HTMLElement).getByRole(
      "button",
      { name: "Delete template" },
    );
    const deferred = createDeferredQueryResult();
    tables.playground_user_templates.execute.mockClear();
    tables.playground_user_templates.execute.mockReturnValueOnce(deferred.promise);

    fireEvent.click(deleteButton);
    await act(async () => {
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      deleteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    expect(deleteButton.querySelector(".lucide-check")).not.toBeInTheDocument();
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute("aria-busy", "true");
    expect(templateButton).toBeInTheDocument();

    await act(async () => {
      deferred.resolve({ data: null, error: persistenceError });
      await deferred.promise;
    });
    await waitFor(() => {
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
      expect(deleteButton).toBeEnabled();
    });
    expect(deleteButton.querySelector(".lucide-check")).not.toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("aria-busy", "false");
    expect(templateButton).toBeInTheDocument();

    fireEvent.click(deleteButton);
    expect(deleteButton.querySelector(".lucide-check")).toBeInTheDocument();
    expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
  });

  it("serializes workspace autosaves so an older snapshot cannot overwrite a newer one", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(1);
    });

    const firstWrite = createDeferredQueryResult();
    const secondWrite = createDeferredQueryResult();
    tables.playground_workspace.execute.mockClear();
    tables.playground_workspace.upsert.mockClear();
    tables.playground_workspace.execute
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(secondWrite.promise);
    const editor = screen.getByRole("textbox", { name: "Playground editor" });

    fireEvent.change(editor, { target: { value: "// First workspace snapshot" } });
    await waitFor(() => {
      expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });

    fireEvent.change(editor, { target: { value: "// Second workspace snapshot" } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1300));
    });

    expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(1);
    expect(tables.playground_workspace.upsert).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstWrite.resolve({ data: null, error: null });
    });
    await waitFor(() => {
      expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(2);
    });
    expect(
      tables.playground_workspace.upsert.mock.calls.map(
        ([payload]) => (payload as { tabs: Array<{ code: string }> }).tabs[0].code,
      ),
    ).toEqual(["// First workspace snapshot", "// Second workspace snapshot"]);

    await act(async () => {
      secondWrite.resolve({ data: null, error: null });
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Save status: Saved")).toBeInTheDocument();
    });
  });

  it("resets the workspace save status and reports a failed autosave", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(1);
    });

    failNextMutation(tables.playground_workspace);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Playground editor" }),
      { target: { value: "// Workspace write that fails" } },
    );

    await waitFor(() => {
      expect(tables.playground_workspace.execute).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByLabelText("Save status: Unsaved")).toBeInTheDocument();
    expect(toastHarness.toast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "destructive" }),
    );
  });

  it("gates manual note Save and Clear writes until hydration succeeds", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const pendingLoad = createDeferredQueryResult();
    tables.practice_problem_user_state.execute.mockReturnValueOnce(pendingLoad.promise);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Open Notes" }));
    const notesEditor = await screen.findByPlaceholderText(
      "Type here...(Markdown is enabled)",
    );

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));

    expect(tables.practice_problem_user_state.upsert).not.toHaveBeenCalled();

    await act(async () => {
      pendingLoad.resolve({ data: { notes: "Hydrated note" }, error: null });
    });
    await waitFor(() => {
      expect(notesEditor).toHaveValue("Hydrated note");
    });
  });

  it("serializes a manual note save ahead of a newer debounced write", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Open Notes" }));
    const notesEditor = await screen.findByPlaceholderText(
      "Type here...(Markdown is enabled)",
    );
    await waitFor(() => {
      expect(tables.practice_problem_user_state.execute).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    const firstWrite = createDeferredQueryResult();
    const secondWrite = createDeferredQueryResult();
    tables.practice_problem_user_state.execute.mockClear();
    tables.practice_problem_user_state.upsert.mockClear();
    tables.practice_problem_user_state.execute
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(secondWrite.promise);

    fireEvent.change(notesEditor, { target: { value: "Older manual note" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(tables.practice_problem_user_state.execute).toHaveBeenCalledTimes(1);

    fireEvent.change(notesEditor, { target: { value: "Newer debounced note" } });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    expect(tables.practice_problem_user_state.execute).toHaveBeenCalledTimes(1);
    expect(tables.practice_problem_user_state.upsert).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstWrite.resolve({ data: null, error: null });
    });
    await waitFor(() => {
      expect(tables.practice_problem_user_state.execute).toHaveBeenCalledTimes(2);
    });
    expect(
      tables.practice_problem_user_state.upsert.mock.calls.map(
        ([payload]) => (payload as { notes: string }).notes,
      ),
    ).toEqual(["Older manual note", "Newer debounced note"]);

    await act(async () => {
      secondWrite.resolve({ data: null, error: null });
    });
  });

  it("does not load or overwrite the anonymous editor-options cache for an authenticated user", async () => {
    const localOptions = {
      minimap: false,
      wordWrap: false,
      cursorSmooth: true,
      bracketPairColorization: false,
      formatOnType: true,
    };
    localStorage.setItem(
      "algoguru.playground.editor_options",
      JSON.stringify(localOptions),
    );
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(
      within(dialog).getByRole("switch", { name: "Toggle minimap" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(dialog).getByRole("switch", { name: "Toggle word wrap" }),
    ).toHaveAttribute("aria-checked", "true");

    fireEvent.click(within(dialog).getByRole("switch", { name: "Toggle word wrap" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Close settings" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });

    expect(
      JSON.parse(localStorage.getItem("algoguru.playground.editor_options") || "{}"),
    ).toEqual(localOptions);
  });

  it("isolates account B and anonymous editor options from account A's cloud preferences", async () => {
    const localOptions = {
      minimap: true,
      wordWrap: false,
      cursorSmooth: false,
      bracketPairColorization: true,
      formatOnType: false,
    };
    localStorage.setItem(
      "algoguru.playground.editor_options",
      JSON.stringify(localOptions),
    );
    authHarness.user = { id: "user-a" };
    const tablesA = mockSupabaseTables([]);
    tablesA.playground_preferences.execute.mockResolvedValueOnce({
      data: {
        theme: "auto",
        font_size: 14,
        tab_size: 4,
        relative_lines: false,
        ask_guru_on_selection: true,
        editor_options: { ...localOptions, minimap: false, wordWrap: true },
      },
      error: null,
    });
    const view = renderWorkspace();
    await waitFor(() => {
      expect(tablesA.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const tablesB = mockSupabaseTables([]);
    authHarness.user = { id: "user-b" };
    view.rerender(
      <TooltipProvider>
        <PlaygroundWorkspace />
      </TooltipProvider>,
    );
    await waitFor(() => {
      expect(tablesB.playground_preferences.execute).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(
      JSON.parse(localStorage.getItem("algoguru.playground.editor_options") || "{}"),
    ).toEqual(localOptions);
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const dialogB = await screen.findByRole("dialog", { name: "Settings" });
    expect(
      within(dialogB).getByRole("switch", { name: "Toggle minimap" }),
    ).toHaveAttribute("aria-checked", "true");
    fireEvent.click(within(dialogB).getByRole("button", { name: "Close settings" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings" }),
      ).not.toBeInTheDocument();
    });

    authHarness.user = null;
    view.rerender(
      <TooltipProvider>
        <PlaygroundWorkspace />
      </TooltipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    const anonymousDialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(
      within(anonymousDialog).getByRole("switch", { name: "Toggle minimap" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(anonymousDialog).getByRole("switch", { name: "Toggle word wrap" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("ignores a saved-template read that resolves after a successful insert", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const pendingLoad = createDeferredQueryResult();
    const pendingInsert = createDeferredQueryResult();
    tables.playground_user_templates.execute
      .mockReturnValueOnce(pendingLoad.promise)
      .mockReturnValueOnce(pendingInsert.promise);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "New Template Before Stale Read" },
    });
    fireEvent.click(within(templateDialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      pendingInsert.resolve({ data: null, error: null });
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });
    await act(async () => {
      pendingLoad.resolve({
        data: [{ ...savedUserTemplate, id: "stale-template", name: "Stale Template" }],
        error: null,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
    expect(
      within(reopenedDialog).getByRole("button", {
        name: /New Template Before Stale Read/,
      }),
    ).toBeInTheDocument();
  });

  it("ignores an override read that resolves after a successful built-in save", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    const pendingLoad = createDeferredQueryResult();
    tables.playground_template_overrides.execute.mockReturnValueOnce(pendingLoad.promise);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const templatesDialog = await screen.findByRole("dialog", { name: "Templates" });
    const templateButton = within(templatesDialog).getByRole("button", {
      name: /^Codeforces/,
    });
    fireEvent.click(
      within(templateButton.parentElement as HTMLElement).getByRole("button", {
        name: "Edit template",
      }),
    );
    const editDialog = await screen.findByRole("dialog", {
      name: "Edit Built-in Template",
    });
    fireEvent.change(within(editDialog).getByLabelText("Description (optional)"), {
      target: { value: "Fresh override description" },
    });
    fireEvent.click(within(editDialog).getByRole("button", { name: "Update" }));
    await waitFor(() => {
      expect(tables.playground_template_overrides.execute).toHaveBeenCalledTimes(2);
      expect(
        screen.queryByRole("dialog", { name: "Edit Built-in Template" }),
      ).not.toBeInTheDocument();
    });

    await act(async () => {
      pendingLoad.resolve({
        data: [{
          user_id: "user-1",
          prefix: "codeforces",
          code: "class Main { /* stale */ }",
          description: "Stale override description",
        }],
        error: null,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    const reopenedDialog = await screen.findByRole("dialog", { name: "Templates" });
    expect(
      within(reopenedDialog).getByText("Fresh override description"),
    ).toBeInTheDocument();
    expect(
      within(reopenedDialog).queryByText("Stale override description"),
    ).not.toBeInTheDocument();
  });

  it("recovers a stable-ID template retry when the first insert committed but its response failed", async () => {
    authHarness.user = { id: "user-1" };
    const tables = mockSupabaseTables([]);
    renderWorkspace();
    await waitFor(() => {
      expect(tables.playground_user_templates.execute).toHaveBeenCalledTimes(1);
    });
    const templateDialog = await openCreateTemplateDialog();
    fireEvent.change(within(templateDialog).getByLabelText(/Template Name/), {
      target: { value: "Committed Before Network Failure" },
    });
    const templateId = "33333333-3333-4333-8333-333333333333";
    const randomUUID = vi.spyOn(crypto, "randomUUID").mockReturnValue(templateId);
    const duplicateKeyError: SupabaseQueryError = {
      ...persistenceError,
      code: "23505",
      message: "duplicate key value violates unique constraint",
    };
    tables.playground_user_templates.execute.mockClear();
    tables.playground_user_templates.insert.mockClear();
    tables.playground_user_templates.upsert.mockClear();
    tables.playground_user_templates.execute
      .mockResolvedValueOnce({ data: null, error: persistenceError })
      .mockResolvedValueOnce({ data: null, error: duplicateKeyError })
      .mockResolvedValueOnce({ data: { id: templateId }, error: null });
    const saveButton = within(templateDialog).getByRole("button", { name: "Save" });

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
      expect(toastHarness.toast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
    toastHarness.toast.mockClear();

    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Save as Template" }),
      ).not.toBeInTheDocument();
    });

    expect(
      tables.playground_user_templates.insert.mock.calls.map(
        ([payload]) => (payload as { id: string }).id,
      ),
    ).toEqual([templateId, templateId]);
    expect(tables.playground_user_templates.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: templateId, user_id: "user-1" }),
      { onConflict: "id" },
    );
    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(toastHarness.toast).not.toHaveBeenCalled();
  });
});
