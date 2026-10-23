import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HomeSidebarContext } from "@/contexts/HomeSidebarContext";
import Index from "./Index";

vi.mock("framer-motion", async (importOriginal) => ({
  ...await importOriginal<typeof import("framer-motion")>(),
  useReducedMotion: () => true,
}));

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

function renderHome(toggleHomeSidebar = vi.fn()) {
  return render(
    <MemoryRouter>
      <HomeSidebarContext.Provider value={{ homeSidebarOpen: false, toggleHomeSidebar }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/playground" element={<p>Playground destination</p>} />
          <Route path="/practice" element={<p>Practice destination</p>} />
        </Routes>
      </HomeSidebarContext.Provider>
    </MemoryRouter>,
  );
}

describe("Home landing page", () => {
  it("renders a visible reduced-motion hero and clearly labels the sample workspace", () => {
    renderHome();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Build skills.Solve smarter.Interview ready.");
    expect(heading.parentElement).not.toHaveStyle({ opacity: "0" });
    expect(screen.getByText("Workspace preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore learning paths/i })).toHaveClass("landing-primary");
    expect(screen.getByLabelText("Example Java solution for Two Sum")).toHaveAttribute("tabindex", "0");
  });

  it.each([
    ["Explore learning paths", "modules"],
    ["Start learning free", "modules"],
    ["Or take a 10-question quiz", "quiz"],
  ])("scrolls %s to its existing section", (name, id) => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    renderHome();
    fireEvent.click(screen.getByRole("button", { name }));
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth" });
    expect(scroll.mock.instances[0]).toBe(document.getElementById(id));
  });

  it("uses instant section scrolling when the browser requests reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /explore learning paths/i }));
    expect(scroll).toHaveBeenCalledWith({ behavior: "auto" });
  });

  it("preserves playground navigation", () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /open playground/i }));
    expect(screen.getByText("Playground destination")).toBeInTheDocument();
  });

  it("preserves all six learning routes and DSA navigation", () => {
    renderHome();
    const modules = document.getElementById("modules")!;
    expect(Array.from(modules.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/java-advanced", "/practice", "/arrays", "/interview/java/system-design", "/interview", "/problem-solver",
    ]);
    fireEvent.click(screen.getByRole("link", { name: /DSA Sheets/ }));
    expect(screen.getByText("Practice destination")).toBeInTheDocument();
  });

  it("opens and closes the lazy-loaded roadmap", async () => {
    renderHome();
    fireEvent.click(screen.getByRole("button", { name: /browse full roadmap/i }));
    expect(await screen.findByRole("dialog", { name: "Learning roadmap" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close roadmap" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserves the library panel toggle", () => {
    const toggle = vi.fn();
    renderHome(toggle);
    fireEvent.click(screen.getByRole("button", { name: /open library panel/i }));
    expect(toggle).toHaveBeenCalledOnce();
  });
});
