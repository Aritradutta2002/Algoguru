import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  mockRouter,
  resetNextNavigationMocks,
  setMockSearchParams,
} from "@/test/nextNavigationMock";
import { AuthView } from "./AuthView";
import { ResetPasswordView } from "./ResetPasswordView";

const supabaseMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  updateUser: vi.fn(),
  unsubscribe: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  session: null as { user: { id: string } } | null,
}));

const settingsState = vi.hoisted(() => ({
  theme: "dark" as "dark" | "light",
  toggleTheme: vi.fn(),
}));

vi.mock("next/navigation", async () => {
  const { createNextNavigationMock } = await import(
    "@/test/nextNavigationMock"
  );
  return createNextNavigationMock();
});

vi.mock("next/link", async () => {
  const { createNextLinkMock } = await import("@/test/nextNavigationMock");
  return createNextLinkMock();
});

vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: supabaseMocks.signInWithPassword,
      signUp: supabaseMocks.signUp,
      signInWithOAuth: supabaseMocks.signInWithOAuth,
      resetPasswordForEmail: supabaseMocks.resetPasswordForEmail,
      getSession: supabaseMocks.getSession,
      onAuthStateChange: supabaseMocks.onAuthStateChange,
      updateUser: supabaseMocks.updateUser,
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.session?.user ?? null,
    profile: null,
    resolvedAvatar: null,
    loading: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({
    theme: settingsState.theme,
    toggleTheme: settingsState.toggleTheme,
    fontSize: "md",
    increaseFontSize: vi.fn(),
    decreaseFontSize: vi.fn(),
    contentWidth: 1100,
    setContentWidth: vi.fn(),
  }),
}));

function renderAuthView() {
  return render(
    <TooltipProvider>
      <AuthView />
    </TooltipProvider>,
  );
}

function renderResetPasswordView() {
  return render(
    <TooltipProvider>
      <ResetPasswordView />
    </TooltipProvider>,
  );
}

function switchToCreateAccountTab() {
  const tab = screen.getByRole("tab", { name: "Create account" });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab, { button: 0, ctrlKey: false });
}

beforeEach(() => {
  resetNextNavigationMocks();
  authState.session = null;
  settingsState.theme = "dark";
  settingsState.toggleTheme.mockReset();

  supabaseMocks.signInWithPassword.mockReset();
  supabaseMocks.signUp.mockReset();
  supabaseMocks.signInWithOAuth.mockReset();
  supabaseMocks.resetPasswordForEmail.mockReset();
  supabaseMocks.getSession.mockReset();
  supabaseMocks.onAuthStateChange.mockReset();
  supabaseMocks.updateUser.mockReset();
  supabaseMocks.unsubscribe.mockReset();

  supabaseMocks.signInWithPassword.mockResolvedValue({ error: null });
  supabaseMocks.signUp.mockResolvedValue({ error: null });
  supabaseMocks.signInWithOAuth.mockResolvedValue({ error: null });
  supabaseMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  supabaseMocks.getSession.mockResolvedValue({ data: { session: null } });
  supabaseMocks.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: supabaseMocks.unsubscribe } },
  });
  supabaseMocks.updateUser.mockResolvedValue({ error: null });
  window.location.hash = "";
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AuthView", () => {
  it("renders enterprise auth workspace, showcase highlights, and theme toggle", () => {
    renderAuthView();

    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in to AlgoGuru" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AlgoGuru home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("tab", { name: "Sign in" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/PKCE & TLS encrypted session/i)).toBeInTheDocument();
    expect(screen.getByText("Interactive DSA Sheets")).toBeInTheDocument();
    expect(screen.getByText("Guru AI Hint")).toBeInTheDocument();
    expect(screen.getByText("Timed Contest")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(settingsState.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("displays an accessible error banner when auth callback fails", () => {
    setMockSearchParams({ error: "auth_callback_failed" });
    renderAuthView();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Authentication could not be completed. Please try signing in again.",
    );
  });

  describe("Sign in", () => {
    it("signs in with valid credentials and redirects to default /", async () => {
      renderAuthView();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "  engineer@algoguru.dev  " },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "StrongPass1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
          email: "engineer@algoguru.dev",
          password: "StrongPass1",
        });
      });

      expect(mockRouter.replace).toHaveBeenCalledWith("/");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it("toggles password visibility with accessible state", () => {
      renderAuthView();

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleBtn = screen.getByRole("button", { name: "Show password" });
      expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(
        screen.getByRole("button", { name: "Hide password" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("shows Supabase error and enforces a temporary cooldown on sign-in failure", async () => {
      supabaseMocks.signInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" },
      });

      renderAuthView();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "dev@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "WrongPass1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Invalid login credentials",
      );
      expect(
        screen.getByRole("button", { name: /try again shortly/i }),
      ).toBeDisabled();
    });
  });

  describe("Sign up", () => {
    it("switches to Create account, validates complexity, and submits sign-up", async () => {
      renderAuthView();
      switchToCreateAccountTab();

      expect(
        screen.getByRole("heading", { level: 1, name: "Create your account" }),
      ).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Full name"), {
        target: { value: "Ada Lovelace" },
      });
      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "ada@analytical.org" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "Engine123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value: "Engine123" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() => {
        expect(supabaseMocks.signUp).toHaveBeenCalledWith({
          email: "ada@analytical.org",
          password: "Engine123",
          options: {
            data: { full_name: "Ada Lovelace" },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      });

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Check your email for a confirmation link.",
      );
    });

    it("shows error alert when signUp returns an error", async () => {
      supabaseMocks.signUp.mockResolvedValueOnce({
        error: { message: "User already registered" },
      });

      renderAuthView();
      switchToCreateAccountTab();

      fireEvent.change(screen.getByLabelText("Full name"), {
        target: { value: "Ada Lovelace" },
      });
      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "ada@analytical.org" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "Engine123" },
      });
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value: "Engine123" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "User already registered",
      );
    });
  });

  describe("Validation", () => {
    it("renders inline field errors with aria-invalid on invalid sign-in submission", () => {
      renderAuthView();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "not-an-email" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "short" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      const emailInput = screen.getByLabelText("Email address");
      const passwordInput = screen.getByLabelText("Password");

      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(passwordInput).toHaveAttribute("aria-invalid", "true");
      expect(
        screen.getByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
      expect(supabaseMocks.signInWithPassword).not.toHaveBeenCalled();

      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
      expect(emailInput).toHaveAttribute("aria-invalid", "false");
    });

    it("validates name, password rules, and password match in sign-up mode", () => {
      renderAuthView();
      switchToCreateAccountTab();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "ada@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "lowercaseonly1" },
      });
      fireEvent.change(screen.getByLabelText("Confirm password"), {
        target: { value: "Mismatch1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      expect(screen.getByLabelText("Full name")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(
        screen.getByText("Must include an uppercase letter"),
      ).toBeInTheDocument();
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      expect(supabaseMocks.signUp).not.toHaveBeenCalled();
    });
  });

  describe("Google OAuth", () => {
    it("initiates Google OAuth flow with callback URL", async () => {
      renderAuthView();

      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      await waitFor(() => {
        expect(supabaseMocks.signInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      });
    });

    it("forwards safe next redirect target to Google OAuth callback URL", async () => {
      setMockSearchParams({ next: "/practice?topic=graphs" });
      renderAuthView();

      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      await waitFor(() => {
        expect(supabaseMocks.signInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=%2Fpractice%3Ftopic%3Dgraphs`,
          },
        });
      });
    });

    it("displays an error banner if Google OAuth fails", async () => {
      supabaseMocks.signInWithOAuth.mockResolvedValueOnce({
        error: { message: "OAuth provider unavailable" },
      });

      renderAuthView();
      fireEvent.click(
        screen.getByRole("button", { name: /continue with google/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "OAuth provider unavailable",
      );
    });
  });

  describe("Forgot password", () => {
    it("opens recovery mode, validates email, sends reset link, and returns to sign in", async () => {
      renderAuthView();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "alex@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));

      expect(
        screen.getByRole("heading", { level: 1, name: "Reset your password" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email address")).toHaveValue(
        "alex@example.com",
      );

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "invalid" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
      expect(
        screen.getByText("Please enter a valid email address"),
      ).toBeInTheDocument();
      expect(supabaseMocks.resetPasswordForEmail).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "alex@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

      await waitFor(() => {
        expect(supabaseMocks.resetPasswordForEmail).toHaveBeenCalledWith(
          "alex@example.com",
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );
      });

      expect(await screen.findByRole("status")).toHaveTextContent(
        "Check your email for a password reset link.",
      );

      fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
      expect(
        screen.getByRole("heading", { level: 1, name: "Sign in to AlgoGuru" }),
      ).toBeInTheDocument();
    });
  });

  describe("Redirect safety", () => {
    it("redirects to a safe relative ?redirect target on sign-in", async () => {
      setMockSearchParams({ redirect: "/practice?sheet=blind75" });
      renderAuthView();

      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: "dev@example.com" },
      });
      fireEvent.change(screen.getByLabelText("Password"), {
        target: { value: "StrongPass1" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          "/practice?sheet=blind75",
        );
      });
    });

    it("redirects to a safe relative ?next target when already authenticated", () => {
      authState.session = { user: { id: "user-1" } };
      setMockSearchParams({ next: "/contest" });
      renderAuthView();

      expect(mockRouter.replace).toHaveBeenCalledWith("/contest");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it.each([
      "//evil.example.com/phish",
      "https://evil.example.com/steal",
      "/\\evil.example.com",
      "/practice\nLocation: https://evil.com",
    ])("blocks unsafe redirect target %s and falls back to /", (unsafeTarget) => {
      authState.session = { user: { id: "user-1" } };
      setMockSearchParams({ redirect: unsafeTarget });
      renderAuthView();

      expect(mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });
});

describe("ResetPasswordView", () => {
  it("redirects unauthorized visitors back to /auth", async () => {
    renderResetPasswordView();

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/auth");
    });
  });

  it("validates matching strong passwords and updates password on recovery hash", async () => {
    window.location.hash = "#access_token=abc&type=recovery";
    renderResetPasswordView();

    const newPasswordInput = await screen.findByLabelText("New password");
    const confirmInput = screen.getByLabelText("Confirm new password");

    fireEvent.change(newPasswordInput, { target: { value: "NewPass123" } });
    fireEvent.change(confirmInput, { target: { value: "Different123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(supabaseMocks.updateUser).not.toHaveBeenCalled();

    fireEvent.change(confirmInput, { target: { value: "NewPass123" } });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(supabaseMocks.updateUser).toHaveBeenCalledWith({
      password: "NewPass123",
    });
    expect(screen.getByRole("status")).toHaveTextContent(/password updated/i);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });
});
