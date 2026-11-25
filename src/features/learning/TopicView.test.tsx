import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TopicView } from "./TopicView";
import { ModeProvider } from "@/contexts/ModeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ContentSection } from "@/data/recursionContent";
import type { Topic } from "@/data/topics";

vi.mock("@/components/ContentRenderer", () => ({
  ContentRenderer: ({ section }: { section: ContentSection }) => (
    <section id={section.id}>{section.title}</section>
  ),
}));

const content: ContentSection[] = [
  {
    id: "intro",
    title: "Introduction",
    theory: ["A short introduction to the topic."],
  },
  {
    id: "details",
    title: "Details",
    theory: ["More detail about the topic."],
  },
];

const topic: Topic = {
  id: "arrays",
  title: "Arrays",
  icon: "▦",
  color: "primary",
  description: "Array patterns",
  subtopics: [],
};

function renderTopicView() {
  return render(
    <TooltipProvider>
      <SettingsProvider>
        <ModeProvider>
          <TopicView
            topicId={topic.id}
            detectedMode="ds"
            topic={topic}
            content={content}
            prevTopic={null}
            nextTopic={null}
          />
        </ModeProvider>
      </SettingsProvider>
    </TooltipProvider>,
  );
}

function getProgressDot(title: string) {
  const dot = screen
    .getAllByRole("button", { name: title })
    .find((button) => button.classList.contains("h-1"));

  if (!dot) throw new Error(`Missing progress dot for ${title}`);
  return dot;
}

describe("TopicView section buttons", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/arrays");
    localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses named shared Buttons for progress dots without changing their size or scrolling", () => {
    renderTopicView();

    const introDot = getProgressDot("Introduction");
    const detailsDot = getProgressDot("Details");
    const detailsSection = document.getElementById("details");
    if (!detailsSection) throw new Error("Missing details section");
    const scrollIntoView = vi.spyOn(detailsSection, "scrollIntoView");

    expect(introDot).toHaveClass("touch-manipulation", "ring-offset-background", "h-1", "rounded-full");
    expect(detailsDot).toHaveClass("touch-manipulation", "ring-offset-background", "h-1", "rounded-full");
    expect(introDot).toHaveAccessibleName("Introduction");
    expect(detailsDot).toHaveAccessibleName("Details");

    fireEvent.click(introDot);
    expect(introDot).toHaveStyle({ width: "32px" });
    expect(detailsDot).toHaveStyle({ width: "8px" });

    fireEvent.click(detailsDot);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(window.location.hash).toBe("#details");
    expect(detailsDot).toHaveStyle({ width: "32px" });
    expect(introDot).toHaveStyle({ width: "8px" });
  });

  it("keeps compact icon sizes on font, theme, and mobile contents controls", () => {
    renderTopicView();

    const compactIconButtons = [
      screen.getByRole("button", { name: "Decrease font size" }),
      screen.getByRole("button", { name: "Increase font size" }),
      screen.getByRole("button", { name: "Toggle theme" }),
    ];
    for (const button of compactIconButtons) {
      expect(button).toHaveClass("[&_svg]:size-[13px]");
    }

    const contentsButton = screen.getByRole("button", { name: "Contents" });
    expect(contentsButton).toHaveClass("[&_svg]:size-3.5");

    fireEvent.click(contentsButton);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("[&_svg]:size-3.5");
  });

  it("uses named shared Buttons for desktop and mobile section navigation", async () => {
    const { container } = renderTopicView();
    const desktopAside = container.querySelector("aside");
    if (!desktopAside) throw new Error("Missing desktop table of contents");

    const desktopDetails = within(desktopAside).getByRole("button", { name: "Details" });
    expect(desktopDetails).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "w-full",
      "text-left",
      "whitespace-normal",
    );

    fireEvent.click(desktopDetails);
    expect(window.location.hash).toBe("#details");

    fireEvent.click(screen.getByRole("button", { name: "Contents" }));
    const mobileNavigation = screen.getAllByRole("navigation").at(-1);
    if (!mobileNavigation) throw new Error("Missing mobile table of contents");
    const mobileDetails = within(mobileNavigation).getByRole("button", { name: "Details" });

    expect(mobileDetails).toHaveClass(
      "touch-manipulation",
      "ring-offset-background",
      "w-full",
      "text-left",
      "whitespace-normal",
    );
    expect(mobileDetails).toHaveAccessibleName("Details");

    fireEvent.click(mobileDetails);

    expect(window.location.hash).toBe("#details");
    await waitFor(() => expect(mobileDetails).not.toBeInTheDocument());
  });
});
