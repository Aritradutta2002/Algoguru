import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileView } from "./ProfileView";

const mocks = vi.hoisted(() => {
  const profileEq = vi.fn();
  const profileUpdate = vi.fn(() => ({ eq: profileEq }));
  const stateSecondEq = vi.fn();
  const stateFirstEq = vi.fn(() => ({ eq: stateSecondEq }));
  const stateSelect = vi.fn(() => ({ eq: stateFirstEq }));
  const upload = vi.fn();
  const remove = vi.fn();
  const storageFrom = vi.fn(() => ({ upload, remove }));
  const from = vi.fn((table: string) => {
    if (table === "practice_problem_user_state") return { select: stateSelect };
    if (table === "profiles") return { update: profileUpdate };
    throw new Error(`Unexpected Supabase table: ${table}`);
  });

  return {
    from,
    profileEq,
    profileUpdate,
    stateSecondEq,
    stateSelect,
    upload,
    remove,
    storageFrom,
    refreshProfile: vi.fn(),
  };
});

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "learner@example.com",
      created_at: "2024-01-01T00:00:00Z",
    },
    profile: null,
    resolvedAvatar: null,
    refreshProfile: mocks.refreshProfile,
    loading: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mocks.from,
    storage: { from: mocks.storageFrom },
  },
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

vi.mock("@/components/ActivityHeatmap", () => ({
  ActivityHeatmap: () => null,
  MODE_INTENSITY_COLORS: {
    website: ["bg-emerald-200"],
    leetcode: ["bg-amber-200"],
    codechef: ["bg-blue-200"],
  },
}));

async function renderProfileView() {
  const view = render(<ProfileView />);
  await act(async () => {});
  return view;
}

describe("ProfileView button primitives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profileEq.mockResolvedValue({ error: null });
    mocks.stateSecondEq.mockResolvedValue({ data: [], error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
  });

  it("uses shared Buttons for every profile action while preserving names, styling, and actions", async () => {
    const { container } = await renderProfileView();
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error("Missing avatar file input");
    const openFilePicker = vi.spyOn(fileInput, "click").mockImplementation(() => {});

    const changeAvatar = screen.getByRole("button", { name: "Change avatar" });
    expect(changeAvatar).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "absolute",
      "-bottom-1",
      "-right-1",
      "h-8",
      "w-8",
      "rounded-full",
      "[&_svg]:size-3.5",
    );
    expect(fileInput).toHaveClass("hidden");
    expect(fileInput).toHaveAttribute("accept", "image/*");

    const editProfile = screen.getByRole("button", { name: "Edit profile" });
    expect(editProfile).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "[&_svg]:size-3",
    );
    const shareProfile = screen.getByRole("button", { name: "Share profile" });
    expect(shareProfile).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "[&_svg]:size-[13px]",
    );

    fireEvent.click(changeAvatar);
    expect(openFilePicker).toHaveBeenCalledTimes(1);

    const addRole = screen.getByRole("button", { name: "Add a role" });
    expect(addRole).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "rounded-full",
      "[&_svg]:size-2.5",
    );

    const emptyLinksButtons = screen.getAllByRole("button", { name: "No links added" });
    expect(emptyLinksButtons).toHaveLength(2);
    for (const button of emptyLinksButtons) {
      expect(button).toHaveClass(
        "touch-manipulation",
        "ring-offset-background",
        "w-full",
        "flex-col",
        "[&_svg]:size-[15px]",
      );
    }

    const connectLeetcode = screen.getByRole("button", { name: /LeetCode.*Connect/ });
    const connectCodechef = screen.getByRole("button", { name: /CodeChef.*Connect/ });
    for (const button of [connectLeetcode, connectCodechef]) {
      expect(button).toHaveClass(
        "touch-manipulation",
        "ring-offset-background",
        "w-full",
        "text-left",
        "whitespace-normal",
        "[&_svg]:size-[15px]",
      );
    }

    fireEvent.click(connectLeetcode);
    const leetcodeDialog = screen.getByRole("dialog", { name: "Link LeetCode account" });
    expect(leetcodeDialog).toBeInTheDocument();
    expect(within(leetcodeDialog).getByRole("button", { name: "Connect" })).toHaveClass(
      "[&_svg]:size-3.5",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(addRole);
    expect(screen.getByRole("heading", { name: "Edit profile" })).toBeInTheDocument();
  });

  it("gives both Connect textboxes visible, associated labels", async () => {
    await renderProfileView();

    fireEvent.click(screen.getByRole("button", { name: /LeetCode.*Connect/ }));
    const leetcodeDialog = screen.getByRole("dialog", { name: "Link LeetCode account" });
    const leetcodeInput = within(leetcodeDialog).getByRole("textbox", {
      name: "LeetCode username",
    });
    const leetcodeLabel = within(leetcodeDialog).getByText("LeetCode username", {
      selector: "label",
    });
    expect(leetcodeLabel).toHaveAttribute("for", leetcodeInput.id);
    expect(leetcodeInput).toHaveAccessibleName("LeetCode username");
    fireEvent.click(within(leetcodeDialog).getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: /CodeChef.*Connect/ }));
    const codechefDialog = screen.getByRole("dialog", { name: "Link CodeChef account" });
    const codechefInput = within(codechefDialog).getByRole("textbox", {
      name: "CodeChef handle",
    });
    const codechefLabel = within(codechefDialog).getByText("CodeChef handle", {
      selector: "label",
    });
    expect(codechefLabel).toHaveAttribute("for", codechefInput.id);
    expect(codechefInput).toHaveAccessibleName("CodeChef handle");
  });

  it("does not submit a blank Connect value from the input Enter handler", async () => {
    await renderProfileView();
    fireEvent.click(screen.getByRole("button", { name: /LeetCode.*Connect/ }));

    const dialog = screen.getByRole("dialog", { name: "Link LeetCode account" });
    const input = within(dialog).getByRole("textbox", { name: "LeetCode username" });
    const connect = within(dialog).getByRole("button", { name: "Connect" });

    expect(connect).toBeDisabled();
    fireEvent.change(input, { target: { value: "   " } });
    expect(connect).toBeDisabled();

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.refreshProfile).not.toHaveBeenCalled();
    expect(dialog).toBeInTheDocument();
  });

  it("ignores Connect Enter while the username is being saved", async () => {
    const pendingUpdates: Array<(result: { error: { message: string } }) => void> = [];
    mocks.profileEq.mockImplementation(
      () =>
        new Promise<{ error: { message: string } }>((resolve) => {
          pendingUpdates.push(resolve);
        }),
    );

    await renderProfileView();
    fireEvent.click(screen.getByRole("button", { name: /LeetCode.*Connect/ }));

    const dialog = screen.getByRole("dialog", { name: "Link LeetCode account" });
    const input = within(dialog).getByRole("textbox", { name: "LeetCode username" });
    const connect = within(dialog).getByRole("button", { name: "Connect" });
    fireEvent.change(input, { target: { value: "new_learner" } });
    expect(connect).toBeEnabled();

    let updateCount = 0;
    try {
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      await waitFor(() => expect(connect).toBeDisabled());
      expect(mocks.profileUpdate).toHaveBeenCalledTimes(1);
      expect(mocks.profileUpdate).toHaveBeenCalledWith({ leetcode_username: "new_learner" });

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
      updateCount = mocks.profileUpdate.mock.calls.length;
    } finally {
      await act(async () => {
        pendingUpdates.forEach((resolve) => resolve({ error: { message: "Test request finished" } }));
      });
    }

    expect(updateCount).toBe(1);
    expect(mocks.refreshProfile).not.toHaveBeenCalled();
  });

  it("keeps the native file input and disables its shared Button opener while uploading", async () => {
    const { container } = await renderProfileView();
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error("Missing avatar file input");
    const openFilePicker = vi.spyOn(fileInput, "click").mockImplementation(() => {});
    const changeAvatar = screen.getByRole("button", { name: "Change avatar" });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    let finishUpload!: (result: { error: null }) => void;
    mocks.upload.mockImplementation(
      () =>
        new Promise<{ error: null }>((resolve) => {
          finishUpload = resolve;
        }),
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(changeAvatar).toBeDisabled());
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/avatar-\d+\.png$/),
      file,
      { upsert: true },
    );

    fireEvent.click(changeAvatar);
    expect(openFilePicker).not.toHaveBeenCalled();

    await act(async () => {
      finishUpload({ error: null });
    });

    await waitFor(() => expect(changeAvatar).toBeEnabled());
    expect(mocks.refreshProfile).toHaveBeenCalledTimes(1);
    expect(fileInput).toHaveClass("hidden");
  });
});
