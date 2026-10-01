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
        <Route path="/quiz" element={<Destination />} />
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

  it("opens a dedicated quiz page rather than an overlay", () => {
    renderSection();
    fireEvent.click(screen.getByRole("link", { name: /open quiz studio/i }));
    expect(screen.getByText("Quiz page: /quiz")).toBeInTheDocument();
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
      screen.getByText(`Quiz page: /quiz?language=${id}`),
    ).toBeInTheDocument();
  });
});
