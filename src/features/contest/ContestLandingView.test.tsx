import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ContestLandingView } from "@/features/contest/ContestLandingView";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";
import { PUBLIC_JAVA_PROBLEMS } from "@/lib/codingContest/javaProblemBank";
import {
  CODING_CONTEST_CONFIG,
  CODING_CONTEST_DURATION_LABEL,
} from "@/lib/contest/config";
vi.mock("next/link", async () => {
  const mod = await import("@/test/nextNavigationMock");
  return mod.createNextLinkMock();
});

function renderLanding() {
  return render(<ContestLandingView />);
}

afterEach(cleanup);

describe("ContestLandingView", () => {
  it("shows the Contest heading and both assessment cards", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { level: 1, name: "Contest" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "MCQ Quiz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Java Coding Contest" }),
    ).toBeInTheDocument();
  });

  it("gives each card its own purpose statement", () => {
    renderLanding();
    expect(
      screen.getByText(
        "Test your programming knowledge with randomized multiple-choice questions in a focused exam environment.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Solve real Java interview problems using a code editor in a timed examination environment.",
      ),
    ).toBeInTheDocument();
  });

  it("derives the MCQ bank count from the real question bank", () => {
    renderLanding();
    expect(
      screen.getByText(new RegExp(`^${MCQ_QUESTIONS.length} questions$`)),
    ).toBeInTheDocument();
  });

  it("describes the MCQ rules that actually apply", () => {
    renderLanding();
    expect(screen.getByText("Topic and difficulty filters")).toBeInTheDocument();
    expect(screen.getByText("Practice or timed")).toBeInTheDocument();
    expect(screen.getByText("Automatic scoring")).toBeInTheDocument();
    expect(screen.getAllByText("Fullscreen enforced")).toHaveLength(2);
  });

  it("states the fixed coding-contest rules", () => {
    renderLanding();
    expect(screen.getByText("Java only")).toBeInTheDocument();
    expect(
      screen.getByText(CODING_CONTEST_DURATION_LABEL),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${CODING_CONTEST_CONFIG.minProblems} or ${CODING_CONTEST_CONFIG.maxProblems} problems`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Built-in code editor")).toBeInTheDocument();
    expect(screen.getByText("Compile and run")).toBeInTheDocument();
    expect(screen.getByText("Visible and hidden tests")).toBeInTheDocument();
  });

  it("does not duplicate the MCQ setup form on the landing page", () => {
    renderLanding();
    expect(screen.queryByLabelText("Language")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Difficulty")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start quiz$/i }),
    ).not.toBeInTheDocument();
  });

  it("links to /contest/quiz from the MCQ action and /contest/coding from the coding action", () => {
    renderLanding();
    expect(
      screen.getByRole("link", { name: "Start MCQ Quiz" }),
    ).toHaveAttribute("href", "/contest/quiz");
    expect(
      screen.getByRole("link", { name: "Start Coding Contest" }),
    ).toHaveAttribute("href", "/contest/coding");
  });

  it("reports the published coding problem count", () => {
    renderLanding();
    const published = PUBLIC_JAVA_PROBLEMS.filter((p) => p.isPublished).length;
    expect(
      screen.getByText(
        `${published} coding problems are currently published.`,
      ),
    ).toBeInTheDocument();
  });

  it("explains the shared fullscreen and timeout rules", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { name: "How both modes work" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fullscreen is mandatory"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Look away and you are warned"),
    ).toBeInTheDocument();
    expect(screen.getByText("Timeout submits for you")).toBeInTheDocument();
  });

  it("uses a responsive grid rather than a fixed width", () => {
    const { container } = renderLanding();
    const grid = container.querySelector(".grid.grid-cols-1");
    expect(grid).toBeTruthy();
    expect(grid?.className).toContain("lg:grid-cols-2");
  });
});
