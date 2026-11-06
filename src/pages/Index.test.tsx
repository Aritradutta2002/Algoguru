import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Index from "./Index";

/**
 * The signed-in home is the workspace opening: it must greet the learner,
 * show their own (possibly empty) numbers, and link into the real routes.
 * The Supabase client is stubbed so the page renders its empty state.
 */

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "riya@example.com" },
    profile: { display_name: "Riya Sharma" },
    session: { access_token: "token" },
    loading: false,
    resolvedAvatar: null,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const result = { data: [], error: null };
  const builder = {
    select: () => builder,
    eq: () => Promise.resolve(result),
  };
  return { supabase: { from: () => builder } };
});

vi.mock("@/components/roadmap/RoadmapFullscreenOverlay", () => ({
  RoadmapFullscreenOverlay: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Learning roadmap">
      <button onClick={onClose}>Close roadmap</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<Index />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Workspace home", () => {
  it("greets the learner by name", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { level: 1, name: /welcome back, riya/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty progress state rather than invented numbers", async () => {
    renderHome();
    expect(await screen.findByText(/no practice history yet/i)).toBeInTheDocument();
    expect(screen.getByText("Problems solved")).toBeInTheDocument();
  });

  it("keeps the core destinations reachable", () => {
    renderHome();
    expect(screen.getByRole("link", { name: /practice problems/i })).toHaveAttribute(
      "href",
      "/practice",
    );
    expect(screen.getByRole("link", { name: /roadmaps/i })).toHaveAttribute("href", "/roadmap");
    expect(screen.getByRole("link", { name: /interview prep/i })).toHaveAttribute(
      "href",
      "/interview",
    );
  });

  it("opens the roadmap overlay from the header action", () => {
    renderHome();
    screen.getByRole("button", { name: /open roadmap/i }).click();
  });
});
