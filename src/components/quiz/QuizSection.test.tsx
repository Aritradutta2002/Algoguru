import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QuizSection } from "@/components/quiz/QuizSection";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";
vi.mock("next/link", async () => {
  const mod = await import("@/test/nextNavigationMock");
  return mod.createNextLinkMock();
});

afterEach(cleanup);

function renderSection() {
  return render(<QuizSection />);
}

describe("QuizSection", () => {
  it("introduces MCQs, timed practice and fullscreen with the actual bank count", () => {
    renderSection();
    expect(
      screen.getByText(new RegExp(`${MCQ_QUESTIONS.length} curated questions`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your pace or against the clock/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/mandatory fullscreen/i)).toBeInTheDocument();
    expect(screen.getByText(/learn from every attempt/i)).toBeInTheDocument();
  });

  it("is branded as the Contest MCQ mode rather than a separate Studio", () => {
    renderSection();
    expect(screen.getByText(/Contest · MCQ Quiz/)).toBeInTheDocument();
  });

  it("sends the main call to action to the Contest landing page", () => {
    renderSection();
    expect(
      screen.getByRole("link", { name: /open contest/i }),
    ).toHaveAttribute("href", "/contest");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["Java", "java"],
    ["C++", "cpp"],
    ["Python", "python"],
  ])("opens the quiz with %s preselected", (label, id) => {
    renderSection();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      `/contest/quiz?language=${id}`,
    );
  });
});
