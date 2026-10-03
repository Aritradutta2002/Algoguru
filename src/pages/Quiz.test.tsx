import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Quiz from "./Quiz";
import { buildMcqQuiz, MCQ_QUESTIONS } from "@/lib/mcqQuizBank";

const route = "/quiz?language=java&difficulty=easy";
const startedAt = new Date("2026-09-30T12:00:00Z");
const javaEasy = MCQ_QUESTIONS.filter(
  (question) => question.language === "java" && question.difficulty === "easy",
);
// Exercise the real shuffling and answer remapping without probabilistic assertions.
const run = buildMcqQuiz("java", "easy", 5, () => 0);
const restoreProperties: Array<() => void> = [];

function setBrowserProperty(target: object, key: string, value: unknown) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, value });
  restoreProperties.push(() => {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  });
}

function changeFullscreen(element: Element | null) {
  setBrowserProperty(document, "fullscreenElement", element);
  document.dispatchEvent(new Event("fullscreenchange"));
}

function enterFullscreen() {
  changeFullscreen(document.documentElement);
}

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  setBrowserProperty(document, "hidden", false);
  setBrowserProperty(document, "fullscreenElement", null);
  setBrowserProperty(
    document.documentElement,
    "requestFullscreen",
    vi.fn().mockImplementation(async () => enterFullscreen()),
  );
  setBrowserProperty(
    document,
    "exitFullscreen",
    vi.fn().mockImplementation(async () => changeFullscreen(null)),
  );
});

afterEach(() => {
  cleanup();
  while (restoreProperties.length) restoreProperties.pop()!();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function renderQuiz(entry = route) {
  return render(
    <MemoryRouter
      initialEntries={[entry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Quiz />
    </MemoryRouter>,
  );
}

async function startQuiz(mode: "practice" | "timed" = "practice") {
  fireEvent.click(
    screen.getByRole("radio", {
      name: mode === "practice" ? /^Practice/ : /^Timed challenge/,
    }),
  );
  if (mode === "timed")
    fireEvent.change(screen.getByRole("combobox", { name: "Time limit" }), {
      target: { value: "1" },
    });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start quiz" }));
  });
}

function options() {
  return within(
    screen.getByRole("group", { name: "Choose one answer" }),
  ).getAllByRole("radio");
}

function goTo(position: number) {
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Question navigation" }),
    ).getByRole("button", { name: new RegExp(`^Question ${position},`) }),
  );
}

function answer(position: number, correct = true) {
  const question = run[position - 1];
  fireEvent.click(
    options()[
      correct ? question.correctIndex : (question.correctIndex + 1) % 4
    ],
  );
}

function expectStat(label: string, value: string) {
  expect(
    screen.getByText(label, { exact: true }).parentElement,
  ).toHaveTextContent(value);
}

function review(position: number) {
  const article = screen
    .getByRole("heading", { name: run[position - 1].question })
    .closest("article");
  expect(article).not.toBeNull();
  return within(article!);
}

function expectAutomaticSubmission() {
  expect(screen.getByRole("status")).toHaveTextContent(
    "Time’s up! Your answers were submitted automatically.",
  );
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expectStat("Time taken", "01:00");
}

describe("Quiz setup and randomized session", () => {
  it.each([
    ["/quiz?language=invalid&difficulty=impossible", "mixed", "mixed"],
    ["/quiz?language=invalid&difficulty=hard", "mixed", "hard"],
    ["/quiz?language=python&difficulty=invalid", "python", "mixed"],
    ["/quiz", "mixed", "mixed"],
  ])(
    "falls back independently for missing or invalid query filters: %s",
    (entry, language, difficulty) => {
      renderQuiz(entry);
      expect(screen.getByRole("combobox", { name: "Language" })).toHaveValue(
        language,
      );
      expect(screen.getByRole("combobox", { name: "Difficulty" })).toHaveValue(
        difficulty,
      );
      expect(screen.getByRole("combobox", { name: "Questions" })).toHaveValue(
        "10",
      );
      expect(
        screen.getByRole("radio", { name: /^Timed challenge/ }),
      ).toBeChecked();
      expect(screen.getByRole("button", { name: "Start quiz" })).toBeEnabled();
    },
  );

  it("clips the requested size to the five matching Java easy questions and starts shuffled radio MCQs", async () => {
    renderQuiz();
    expect(javaEasy).toHaveLength(5);
    fireEvent.change(screen.getByRole("combobox", { name: "Questions" }), {
      target: { value: "20" },
    });
    expect(screen.getByText("5 random MCQs")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      /include all 5, without repeats or changing difficulty/,
    );
    await startQuiz();

    expect(run.map((question) => question.id)).not.toEqual(
      javaEasy.map((question) => question.id),
    );
    expect(
      run.some(
        (question) =>
          question.options.join("|") !==
          javaEasy
            .find((source) => source.id === question.id)!
            .options.join("|"),
      ),
    ).toBe(true);
    expect(
      within(
        screen.getByRole("navigation", { name: "Question navigation" }),
      ).getAllByRole("button"),
    ).toHaveLength(5);
    const seen = new Set<string>();
    for (let position = 1; position <= 5; position++) {
      goTo(position);
      const question = run[position - 1];
      const heading = screen.getByRole("heading", { name: question.question });
      expect(heading).toHaveFocus();
      expect(screen.getByText(`Question ${position} of 5`)).toBeInTheDocument();
      expect(options()).toHaveLength(4);
      question.options.forEach((option, index) => {
        expect(options()[index]).toHaveAccessibleName(
          `${String.fromCharCode(65 + index)}. ${option}`,
        );
        expect(options()[index]).not.toBeChecked();
      });
      expect(screen.queryByText(question.explanation)).not.toBeInTheDocument();
      seen.add(question.id);
    }
    expect([...seen].sort()).toEqual(
      javaEasy.map((question) => question.id).sort(),
    );
    expect(
      screen.getByRole("button", { name: "Review & submit" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next question" }),
    ).not.toBeInTheDocument();
    // This test renders a complete 5-question exam and then walks every
    // question, asserting focus, option labels and hidden explanations for each
    // one. It costs ~1.3s on its own and several seconds under parallel test
    // load, which overruns vitest's 5s default once the suite has grown. The
    // timeout is raised for that reason only; no assertion is relaxed.
  }, 20_000);
});

describe("Quiz answers, navigation and submission", () => {
  it("persists and revises answers across next, previous and question navigation", async () => {
    renderQuiz();
    await startQuiz();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    answer(1);
    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    answer(2, false);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(options()[run[0].correctIndex]).toBeChecked();
    answer(1, false);
    goTo(2);
    expect(options()[(run[1].correctIndex + 1) % 4]).toBeChecked();
    goTo(1);
    expect(options()[(run[0].correctIndex + 1) % 4]).toBeChecked();
    expect(options()[run[0].correctIndex]).not.toBeChecked();
    expect(
      screen.getByRole("progressbar", { name: "Answers completed" }),
    ).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByRole("button", { name: "Question 1, answered" }),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("2 of 5 answered")).toBeInTheDocument();
  });

  it("toggles flags independently of answers and clears only the current answer", async () => {
    renderQuiz();
    await startQuiz();
    expect(screen.getByRole("button", { name: "Clear answer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Flag for review" }));
    expect(
      screen.getByRole("button", { name: "Flagged for review" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Question 1, unanswered, flagged" }),
    ).toBeInTheDocument();
    answer(1);
    goTo(2);
    answer(2);
    goTo(1);
    fireEvent.click(screen.getByRole("button", { name: "Clear answer" }));
    expect(
      options().every((option) => !(option as HTMLInputElement).checked),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Clear answer" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Question 1, unanswered, flagged" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Flagged for review" }));
    expect(
      screen.getByRole("button", { name: "Flag for review" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Question 1, unanswered" }),
    ).toBeInTheDocument();
    goTo(2);
    expect(options()[run[1].correctIndex]).toBeChecked();
  });

  it("cancels then confirms submission and automatically scores correct, revised, wrong and unanswered choices", async () => {
    renderQuiz();
    await startQuiz();
    answer(1, false);
    answer(1); // Only the final choice counts, including after answer shuffling.
    fireEvent.click(screen.getByRole("button", { name: "Flag for review" }));
    goTo(2);
    answer(2, false);
    goTo(3);
    answer(3);
    goTo(5);
    fireEvent.click(screen.getByRole("button", { name: "Review & submit" }));
    let dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleName("Submit your answers?");
    expect(dialog).toHaveTextContent(
      "3 of 5 questions answered. 2 unanswered and 1 flagged for review.",
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep solving" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    goTo(1);
    expect(options()[run[0].correctIndex]).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));
    dialog = screen.getByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Submit answers" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your quiz is submitted.",
    );
    expectStat("Score", "40%");
    expectStat("Correct", "2 / 5");
    expectStat("Unanswered", "2");
    expect(screen.getAllByRole("article")).toHaveLength(5);
    for (let position = 1; position <= 5; position++) {
      const question = run[position - 1];
      const item = review(position);
      const status =
        position === 1 || position === 3
          ? "Correct"
          : position === 2
            ? "Incorrect"
            : "Unanswered";
      expect(
        item.getByText(
          `Question ${position} · ${status}${position === 1 ? " · Flagged" : ""}`,
        ),
      ).toBeInTheDocument();
      expect(item.getByText("Correct answer:").parentElement).toHaveTextContent(
        `Correct answer: ${question.options[question.correctIndex]}`,
      );
      const selected =
        position === 2
          ? question.options[(question.correctIndex + 1) % 4]
          : position <= 3
            ? question.options[question.correctIndex]
            : "Not answered";
      expect(item.getByText("Your answer:").parentElement).toHaveTextContent(
        `Your answer: ${selected}`,
      );
      expect(item.getByText(question.explanation)).toBeInTheDocument();
    }
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("requires leave confirmation, preserves a canceled attempt and discards a confirmed attempt", async () => {
    renderQuiz();
    await startQuiz();
    answer(1);
    fireEvent.click(screen.getByRole("button", { name: "Flag for review" }));
    fireEvent.click(screen.getByRole("button", { name: "Leave quiz" }));
    expect(screen.getByRole("alertdialog")).toHaveAccessibleName(
      "Leave this quiz?",
    );
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Keep solving",
      }),
    );
    expect(options()[run[0].correctIndex]).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Flagged for review" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Leave quiz" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Leave quiz",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Build your challenge" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Answer review" }),
    ).not.toBeInTheDocument();
    await startQuiz();
    expect(screen.getByText("0 of 5 answered")).toBeInTheDocument();
    expect(
      options().every((option) => !(option as HTMLInputElement).checked),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Flag for review" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Quiz deadlines", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);
  });

  it("has no deadline in practice mode and continues accepting answers after a long pause", async () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("radio", { name: /^Practice/ }));
    expect(screen.getByRole("combobox", { name: "Time limit" })).toBeDisabled();
    expect(screen.getByText("At your own pace")).toBeInTheDocument();
    await startQuiz();
    expect(
      screen.getByRole("timer", { name: "Time elapsed" }),
    ).toHaveTextContent("00:00");
    act(() => {
      vi.setSystemTime(startedAt.getTime() + 2 * 60 * 60_000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(
      screen.getByRole("timer", { name: "Time elapsed" }),
    ).toHaveTextContent("120:00");
    answer(1);
    expect(options()[run[0].correctIndex]).toBeChecked();
    expect(
      screen.queryByRole("heading", { name: "Answer review" }),
    ).not.toBeInTheDocument();
  });

  it("counts down one minute and auto-submits at zero, closing an open confirmation", async () => {
    renderQuiz();
    await startQuiz("timed");
    answer(1);
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("01:00");
    act(() => vi.advanceTimersByTime(59_000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:01");
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1_000));
    expectAutomaticSubmission();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expectStat("Score", "20%");
    expectStat("Correct", "1 / 5");
    expectStat("Unanswered", "4");
    expect(review(1).getByText("Question 1 · Correct")).toBeInTheDocument();
    expect(review(2).getByText("Your answer:").parentElement).toHaveTextContent(
      "Not answered",
    );
  });

  it.each(["visibilitychange", "focus"])(
    "uses the wall-clock deadline after a suspended tab resumes via %s",
    async (event) => {
      renderQuiz();
      await startQuiz("timed");
      act(() => {
        vi.setSystemTime(startedAt.getTime() + 90_000);
        (event === "focus" ? window : document).dispatchEvent(new Event(event));
      });
      expectAutomaticSubmission();
      expectStat("Correct", "0 / 5");
      expectStat("Unanswered", "5");
    },
  );

  it.each([60_000, 61_000])(
    "rejects a late new answer at %i ms even before the next timer tick",
    async (elapsed) => {
      renderQuiz();
      await startQuiz("timed");
      answer(1);
      goTo(2);
      // setSystemTime intentionally does not run the interval or visibility handler.
      vi.setSystemTime(startedAt.getTime() + elapsed);
      answer(2);
      expectAutomaticSubmission();
      expectStat("Correct", "1 / 5");
      expectStat("Unanswered", "4");
      expect(
        review(2).getByText("Question 2 · Unanswered"),
      ).toBeInTheDocument();
      expect(review(1).getByText("Question 1 · Correct")).toBeInTheDocument();
    },
  );

  it("does not revise an existing answer once its deadline has passed", async () => {
    renderQuiz();
    await startQuiz("timed");
    answer(1, false);
    vi.setSystemTime(startedAt.getTime() + 60_000);
    answer(1);
    expectAutomaticSubmission();
    expectStat("Correct", "0 / 5");
    expectStat("Unanswered", "4");
    expect(review(1).getByText("Question 1 · Incorrect")).toBeInTheDocument();
    expect(review(1).getByText("Your answer:").parentElement).toHaveTextContent(
      run[0].options[(run[0].correctIndex + 1) % 4],
    );
  });
});

function expectLocked(reason: string, count = 1) {
  const dialog = screen.getByRole("alertdialog", {
    name: "Exam fullscreen warning",
  });
  expect(dialog).toHaveTextContent(reason);
  expect(dialog).toHaveTextContent(`Warning ${count} ·`);
  expect(
    screen.queryByRole("group", { name: "Choose one answer" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: run[0].question }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("navigation", { name: "Question navigation" }),
  ).not.toBeInTheDocument();
  return dialog;
}

async function resumeExam() {
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Return to fullscreen" }),
    );
  });
}

describe("Quiz mandatory fullscreen", () => {
  it.each(["unsupported", "rejected", "no actual entry"])(
    "does not start an exam or timer when fullscreen is %s",
    async (failure) => {
      const request =
        failure === "unsupported"
          ? undefined
          : failure === "rejected"
            ? vi.fn().mockRejectedValue(new Error("Fullscreen denied"))
            : vi.fn().mockResolvedValue(undefined);
      setBrowserProperty(
        document.documentElement,
        "requestFullscreen",
        request,
      );
      renderQuiz();
      await startQuiz("timed");
      expect(
        screen.getByRole("heading", { name: "Build your challenge" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start quiz" })).toBeEnabled();
      expect(screen.queryByRole("timer")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("group", { name: "Choose one answer" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(document.fullscreenElement).toBeNull();
      expect(
        screen
          .getAllByRole("status")
          .some((status) =>
            status.textContent?.includes(
              failure === "unsupported"
                ? "Fullscreen is mandatory for this exam."
                : "Fullscreen permission is required.",
            ),
          ),
      ).toBe(true);
      if (request) expect(request).toHaveBeenCalledTimes(1);
    },
  );

  it("starts the one-minute deadline only after a delayed fullscreen request succeeds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);
    let resolveRequest!: () => void;
    const request = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    setBrowserProperty(document.documentElement, "requestFullscreen", request);
    renderQuiz();
    await startQuiz("timed");
    expect(
      screen.getByRole("button", { name: "Opening fullscreen…" }),
    ).toBeDisabled();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Answer review" }),
    ).not.toBeInTheDocument();
    await act(async () => {
      enterFullscreen();
      resolveRequest();
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("timer", { name: "Time remaining" }),
    ).toHaveTextContent("01:00");
    act(() => vi.advanceTimersByTime(59_000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:01");
    act(() => vi.advanceTimersByTime(1_000));
    expectAutomaticSubmission();
  });

  it("requires fullscreen without a checkbox or an exit control during the exam", async () => {
    renderQuiz();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("Mandatory fullscreen exam")).toBeInTheDocument();
    await startQuiz();
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(document.fullscreenElement).toBe(document.documentElement);
    expect(screen.getByText("Fullscreen required")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fullscreen" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Exit fullscreen" }),
    ).not.toBeInTheDocument();
    expect(options()).toHaveLength(4);
  });

  it("retains explicit fullscreen controls on setup and results", async () => {
    renderQuiz();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    });
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
    });
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Fullscreen" }),
    ).toBeInTheDocument();
    await startQuiz();
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Submit answers",
      }),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" }));
    });
    expect(document.exitFullscreen).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Fullscreen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Answer review" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("locks on fullscreen exit, cannot dismiss with Escape, and preserves answers after a successful resume", async () => {
    renderQuiz();
    await startQuiz();
    answer(1);
    fireEvent.click(screen.getByRole("button", { name: "Flag for review" }));
    goTo(2);
    answer(2, false);
    fireEvent.click(screen.getByRole("button", { name: "Submit quiz" }));
    act(() => changeFullscreen(null));
    const dialog = expectLocked("You left fullscreen.");
    expect(
      screen.queryByRole("alertdialog", { name: "Submit your answers?" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Keep solving" }),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expectLocked("You left fullscreen.");

    setBrowserProperty(
      document.documentElement,
      "requestFullscreen",
      vi.fn().mockRejectedValue(new Error("Denied")),
    );
    await resumeExam();
    expectLocked("You left fullscreen.");
    expect(
      within(screen.getByRole("alertdialog")).getByRole("status"),
    ).toHaveTextContent("Fullscreen permission is required.");

    setBrowserProperty(
      document.documentElement,
      "requestFullscreen",
      vi.fn().mockImplementation(async () => enterFullscreen()),
    );
    await resumeExam();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Question 2 of 5")).toBeInTheDocument();
    expect(options()[(run[1].correctIndex + 1) % 4]).toBeChecked();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2",
    );
    goTo(1);
    expect(options()[run[0].correctIndex]).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Flagged for review" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it.each(["hidden", "blur"])(
    "locks when the exam loses focus through %s and requires explicit resume",
    async (interruption) => {
      renderQuiz();
      await startQuiz();
      answer(1);
      act(() => {
        if (interruption === "hidden") {
          setBrowserProperty(document, "hidden", true);
          document.dispatchEvent(new Event("visibilitychange"));
        } else window.dispatchEvent(new Event("blur"));
      });
      const reason =
        interruption === "hidden"
          ? "You switched tabs or minimized the exam."
          : "The exam window lost focus.";
      expectLocked(reason);
      if (interruption === "hidden") {
        await resumeExam();
        expectLocked(reason); // Fullscreen alone cannot unlock a hidden document.
      }
      act(() => {
        setBrowserProperty(document, "hidden", false);
        document.dispatchEvent(new Event("visibilitychange"));
        window.dispatchEvent(new Event("focus"));
      });
      expectLocked(reason);
      await resumeExam();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(options()[run[0].correctIndex]).toBeChecked();
    },
  );

  it("counts new interruptions once each and reports accumulated warnings in results", async () => {
    renderQuiz();
    await startQuiz();
    answer(1);
    act(() => {
      changeFullscreen(null);
      window.dispatchEvent(new Event("blur"));
      setBrowserProperty(document, "hidden", true);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expectLocked("You left fullscreen.", 1);
    setBrowserProperty(document, "hidden", false);
    await resumeExam();
    act(() => window.dispatchEvent(new Event("blur")));
    expectLocked("The exam window lost focus.", 2);
    await resumeExam();
    act(() => {
      setBrowserProperty(document, "hidden", true);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expectLocked("You switched tabs or minimized the exam.", 3);
    fireEvent.click(
      screen.getByRole("button", { name: "Submit and end exam" }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Exam focus warnings: 3")).toBeInTheDocument();
    expectStat("Correct", "1 / 5");
    expectStat("Unanswered", "4");
  });

  it("keeps the countdown running and auto-submits while questions are locked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);
    renderQuiz();
    await startQuiz("timed");
    answer(1);
    act(() => changeFullscreen(null));
    expectLocked("You left fullscreen.");
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Time remaining: 01:00",
    );
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Time remaining: 00:30",
    );
    expectLocked("You left fullscreen.");
    act(() => vi.advanceTimersByTime(30_000));
    expectAutomaticSubmission();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Exam focus warnings: 1")).toBeInTheDocument();
    expectStat("Correct", "1 / 5");
    expectStat("Unanswered", "4");
  });

  it("uses the visibility wall-clock deadline to auto-submit a hidden, locked exam", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(startedAt);
    renderQuiz();
    await startQuiz("timed");
    answer(1);
    act(() => {
      setBrowserProperty(document, "hidden", true);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expectLocked("You switched tabs or minimized the exam.");
    act(() => {
      vi.setSystemTime(startedAt.getTime() + 90_000);
      setBrowserProperty(document, "hidden", false);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expectAutomaticSubmission();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Exam focus warnings: 1")).toBeInTheDocument();
    expectStat("Correct", "1 / 5");
    expectStat("Unanswered", "4");
  });
});
