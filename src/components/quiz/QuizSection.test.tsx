import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QuizSection } from "@/components/quiz/QuizSection";
import { MCQ_QUESTIONS } from "@/lib/mcqQuizBank";

function Destination() {
  const location = useLocation();
  return (
    <p>
      Quiz page: {location.pathname}
      {location.search}
    </p>
  );
}
function renderSection() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<QuizSection />} />
        <Route path="/contest" element={<div>Contest landing</div>} />
        <Route path="/contest/quiz" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
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
    fireEvent.click(screen.getByRole("link", { name: /open contest/i }));
    expect(screen.getByText("Contest landing")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["Java", "java"],
    ["C++", "cpp"],
    ["Python", "python"],
  ])("opens the quiz with %s preselected", (label, id) => {
    renderSection();
    fireEvent.click(screen.getByRole("link", { name: label }));
    expect(
      screen.getByText(`Quiz page: /contest/quiz?language=${id}`),
    ).toBeInTheDocument();
  });
});
