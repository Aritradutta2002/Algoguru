import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuizSection } from "@/components/quiz/QuizSection";
import { QUIZ_LENGTH } from "@/lib/quizBank";

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
  }
  vi.stubGlobal("IntersectionObserver", IO);
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
});

beforeEach(() => {
  window.localStorage.clear();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <QuizSection />
    </MemoryRouter>,
  );
}

function chooseLanguage(label: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
}

function chooseDifficulty(label: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
}

describe("QuizSection picker", () => {
  it("offers Java, C++ and Python with live bank counts", () => {
    renderSection();
    for (const label of ["Java", "C\\+\\+", "Python"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    }
    expect(screen.getAllByText(/questions$/i).length).toBeGreaterThanOrEqual(3);
  });

  it("keeps Start disabled until a language and a difficulty are both chosen", () => {
    renderSection();
    const start = screen.getByRole("button", { name: /start quiz/i });
    expect(start).toBeDisabled();

    chooseLanguage("C\\+\\+");
    expect(start).toBeDisabled();

    chooseDifficulty("Easy");
    expect(start).toBeEnabled();
  });

  it("locks difficulty options until a language is chosen", () => {
    renderSection();
    expect(screen.getByRole("button", { name: /^Easy/ })).toBeDisabled();
    expect(screen.getAllByText(/pick a language first/i)).toHaveLength(3);

    chooseLanguage("Python");
    expect(screen.getByRole("button", { name: /^Easy/ })).toBeEnabled();
    expect(screen.queryByText(/pick a language first/i)).toBeNull();
  });

  it("recomputes availability when the language changes", () => {
    renderSection();
    chooseLanguage("Java");
    const javaEasy = screen.getByRole("button", { name: /^Easy/ }).textContent ?? "";

    chooseLanguage("Python");
    const pythonEasy = screen.getByRole("button", { name: /^Easy/ }).textContent ?? "";

    expect(pythonEasy).not.toBe(javaEasy);
  });

  it("clears a chosen difficulty when the language changes", () => {
    renderSection();
    chooseLanguage("Java");
    chooseDifficulty("Hard");
    expect(screen.getByRole("button", { name: /start quiz/i })).toBeEnabled();

    chooseLanguage("Python");
    expect(screen.getByRole("button", { name: /start quiz/i })).toBeDisabled();
  });

  it("warns when a level cannot fill a full-length run on its own", () => {
    renderSection();
    // Java's hard bank is the smallest slice, so it needs a top-up.
    chooseLanguage("Java");
    chooseDifficulty("Hard");
    expect(screen.getByText(/filled from a nearby level/i)).toBeInTheDocument();
  });
});

describe("QuizPlayer", () => {
  it("opens on the first question and reveals the editorial on demand", async () => {
    renderSection();
    chooseLanguage("Java");
    chooseDifficulty("Easy");

    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(`Question 1 of ${QUIZ_LENGTH}`)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /reveal answer/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /got it right/i })).toBeNull();

    fireEvent.click(within(dialog).getByRole("button", { name: /reveal answer/i }));

    expect(await within(dialog).findByText(/editorial answer/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /got it right/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /i missed it/i })).toBeInTheDocument();
  });

  it("advances through every question and lands on the results screen", async () => {
    renderSection();
    chooseLanguage("Java");
    chooseDifficulty("Easy");
    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    const dialog = await screen.findByRole("dialog");

    for (let i = 0; i < QUIZ_LENGTH; i += 1) {
      const reveal = await within(dialog).findByRole("button", { name: /reveal answer/i });
      fireEvent.click(reveal);
      const correct = await within(dialog).findByRole("button", { name: /got it right/i });
      fireEvent.click(correct);
    }

    expect(await within(dialog).findByText(/flawless run/i)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /retake this level/i })).toBeInTheDocument();
  }, 20_000);

  it("lists missed questions in the review", async () => {
    renderSection();
    chooseLanguage("Python");
    chooseDifficulty("Easy");
    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    const dialog = await screen.findByRole("dialog");

    for (let i = 0; i < QUIZ_LENGTH; i += 1) {
      const reveal = await within(dialog).findByRole("button", { name: /reveal answer/i });
      fireEvent.click(reveal);
      const missed = await within(dialog).findByRole("button", { name: /i missed it/i });
      fireEvent.click(missed);
    }

    expect(await within(dialog).findByText(/review what you missed/i)).toBeInTheDocument();
    expect(within(dialog).getByText(`${QUIZ_LENGTH} to review`)).toBeInTheDocument();
  }, 20_000);

  it("closes on Escape", async () => {
    renderSection();
    chooseLanguage("Java");
    chooseDifficulty("Easy");
    fireEvent.click(screen.getByRole("button", { name: /start quiz/i }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
