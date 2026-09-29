/**
 * "Take a Quiz" section for the landing page.
 *
 * Two-step picker — pick a language, then a level of difficulty — followed by a
 * launch card that summarises the run. Starting the quiz opens `QuizPlayer` in
 * a fullscreen overlay; the section itself stays scrollable and inert.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Gauge,
  Layers3,
  Play,
  Shuffle,
  Sparkles,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import {
  getQuizDifficultyAccent,
  getQuizDifficulties,
  getQuizLanguageAccent,
  getQuizLanguages,
  QUIZ_LENGTH,
  QUIZ_SECONDS_PER_QUESTION,
  QUIZ_TOTAL_QUESTIONS,
  type QuizDifficulty,
  type QuizLanguage,
} from "@/lib/quizBank";

const LANGUAGE_ICONS: Record<QuizLanguage, typeof Layers3> = {
  java: Layers3,
  cpp: BarChart3,
  python: Gauge,
};

const DIFFICULTY_ICONS: Record<QuizDifficulty, typeof Flame> = {
  easy: Sparkles,
  medium: Flame,
  hard: TriangleAlert,
};
const DIFFICULTY_RING: Record<QuizDifficulty, string> = {
  easy: "group-hover:border-success/50",
  medium: "group-hover:border-warning/50",
  hard: "group-hover:border-destructive/50",
};

export function QuizSection() {
  const [language, setLanguage] = useState<QuizLanguage | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  const languages = useMemo(() => getQuizLanguages(), []);
  const difficulties = useMemo(() => getQuizDifficulties(language), [language]);

  const ready = language !== null && difficulty !== null;
  const accent = language ? getQuizLanguageAccent(language) : "hsl(var(--primary))";
  const selectedLanguage = languages.find((item) => item.id === language);
  const selectedDifficulty = difficulties.find((item) => item.id === difficulty);
  const shortage =
    language && difficulty
      ? Math.max(0, QUIZ_LENGTH - (selectedDifficulty?.count ?? 0))
      : 0;

  function chooseLanguage(next: QuizLanguage) {
    if (next === language) return;
    setLanguage(next);
    setDifficulty(null);
  }

  function handleClosePlayer() {
    setPlayerOpen(false);
  }

  return (
    <section
      id="quiz"
      className="relative overflow-hidden border-y border-border/60 bg-muted/30"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--primary)/0.14),transparent_42%),radial-gradient(circle_at_88%_100%,hsl(var(--accent)/0.10),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(hsl(var(--foreground)/0.06)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32 lg:px-16">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.10] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Shuffle size={13} />
            Take a quiz
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl">
            Find your gaps in{" "}
            <span className="bg-gradient-to-r from-primary via-[#60A5FA] to-accent bg-clip-text text-transparent">
              ten questions
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Pick a language and a level of difficulty. We pull {QUIZ_LENGTH} random questions from
            your existing question bank, {QUIZ_SECONDS_PER_QUESTION} seconds each, then tell you
            exactly where you stand.
          </p>
        </motion.div>

        {/* Stepper shell */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 overflow-hidden rounded-[2rem] border border-border bg-card/80 shadow-overlay backdrop-blur-xl"
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl transition-colors duration-500" style={{ background: `${accent}22` }} />

          <div className="relative grid gap-10 p-7 md:p-10 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
            {/* Steps 1 + 2 */}
            <div className="space-y-10">
              {/* Step 1 — language */}
              <StepHeader
                step="01"
                title="Choose your language"
                done={language !== null}
                accent={accent}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                {languages.map((item) => {
                  const Icon = LANGUAGE_ICONS[item.id];
                  const itemAccent = getQuizLanguageAccent(item.id);
                  const active = item.id === language;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseLanguage(item.id)}
                      aria-pressed={active}
                      className={`group relative flex touch-manipulation flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "shadow-soft"
                          : "border-border bg-background/40 hover:-translate-y-1 hover:shadow-card"
                      }`}
                      style={
                        active
                          ? {
                              borderColor: `${itemAccent}66`,
                              background: `linear-gradient(160deg, ${itemAccent}1F, transparent 70%), hsl(var(--card))`,
                            }
                          : undefined
                      }
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-[3px] origin-left transition-transform duration-500 ease-premium"
                        style={{
                          background: `linear-gradient(90deg, ${itemAccent}, transparent)`,
                          transform: active ? "scaleX(1)" : "scaleX(0)",
                        }}
                      />

                      <div className="flex w-full items-center justify-between">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-300 ease-premium group-hover:-rotate-3 group-hover:scale-110"
                          style={{
                            background: `${itemAccent}14`,
                            borderColor: `${itemAccent}2E`,
                            color: itemAccent,
                          }}
                        >
                          <Icon size={20} />
                        </span>
                        {active && (
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                            style={{ background: itemAccent, color: "hsl(var(--background))" }}
                          >
                            <Check size={13} strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-display text-lg font-bold tracking-tight">{item.label}</p>
                        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                          {item.blurb}
                        </p>
                      </div>

                      <div className="mt-auto flex w-full items-center gap-1.5 pt-1">
                        {(["easy", "medium", "hard"] as QuizDifficulty[]).map((level) => (
                          <span
                            key={level}
                            title={`${item.counts[level]} ${level}`}
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: item.counts[level]
                                ? `${getQuizDifficultyAccent(level)}59`
                                : "hsl(var(--border))",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[12px] font-semibold text-muted-foreground">
                        {item.total} questions
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Connector */}
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Step 2
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
              </div>

              {/* Step 2 — difficulty */}
              <StepHeader
                step="02"
                title="Select level of difficulty"
                done={difficulty !== null}
                accent={accent}
                disabled={language === null}
              />

              <div
                className={`grid gap-3 sm:grid-cols-3 transition-opacity duration-300 ${
                  language === null ? "pointer-events-none opacity-40" : "opacity-100"
                }`}
              >
                {difficulties.map((item) => {
                  const Icon = DIFFICULTY_ICONS[item.id];
                  const levelAccent = getQuizDifficultyAccent(item.id);
                  const active = item.id === difficulty;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={language === null}
                      onClick={() => setDifficulty(item.id)}
                      aria-pressed={active}
                      className={`group flex touch-manipulation flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all duration-300 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "shadow-soft"
                          : "border-border bg-background/40 hover:-translate-y-1 hover:shadow-card"
                      } ${DIFFICULTY_RING[item.id]}`}
                      style={
                        active
                          ? {
                              borderColor: `${levelAccent}66`,
                              background: `linear-gradient(160deg, ${levelAccent}1F, transparent 70%), hsl(var(--card))`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${levelAccent}14`,
                          borderColor: `${levelAccent}33`,
                          color: levelAccent,
                        }}
                      >
                        <Icon size={12} />
                        {item.label}
                      </span>
                      <p className="text-[13px] leading-5 text-muted-foreground">{item.blurb}</p>
                      <p className="mt-auto pt-2 text-[12px] font-semibold text-muted-foreground">
                        {language === null ? (
                          "Pick a language first"
                        ) : (
                          <>
                            {item.count} in bank
                            {item.topUpNeeded && (
                              <span className="ml-1 text-warning">
                                · tops up to reach {QUIZ_LENGTH}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <div
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-background/60 p-7 shadow-card transition-colors duration-500"
                style={ready ? { borderColor: `${accent}44` } : undefined}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Your quiz
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-bold"
                    style={{
                      background: `${accent}14`,
                      borderColor: `${accent}33`,
                      color: accent,
                    }}
                  >
                    {selectedLanguage ? selectedLanguage.label[0] : "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl font-bold tracking-tight">
                      {selectedLanguage?.label ?? "Pick a language"}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {selectedDifficulty
                        ? `${selectedDifficulty.label} · ${selectedDifficulty.count} available`
                        : "Difficulty not selected"}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5">
                  {[
                    { icon: Layers3, label: `${QUIZ_LENGTH} random questions` },
                    { icon: Timer, label: `${QUIZ_SECONDS_PER_QUESTION}s per question` },
                    { icon: BarChart3, label: "Instant score + review" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5 text-[14px]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/12 text-primary">
                        <item.icon size={13} />
                      </span>
                      <span className="text-muted-foreground">{item.label}</span>
                    </li>
                  ))}
                </ul>

                {difficulty && shortage > 0 && (
                  <p className="mt-5 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/[0.08] px-3.5 py-3 text-[12.5px] leading-5 text-warning">
                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Only {selectedDifficulty?.count} {difficulty} question
                      {selectedDifficulty?.count === 1 ? "" : "s"} in this bank, so the last{" "}
                      {shortage} {shortage === 1 ? "is" : "are"} filled from a nearby level.
                    </span>
                  </p>
                )}

                <div className="mt-auto pt-7">
                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => setPlayerOpen(true)}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-[15px] font-bold shadow-accent transition-all duration-300 ease-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 enabled:hover:-translate-y-0.5 enabled:hover:shadow-overlay enabled:hover:brightness-105"
                    style={
                      ready
                        ? {
                            background: accent,
                            color: "hsl(var(--background))",
                          }
                        : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    <Play size={16} fill="currentColor" />
                    Start quiz
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </button>
                  <p className="mt-3 text-center text-[12px] text-muted-foreground">
                    Randomly sampled from {QUIZ_TOTAL_QUESTIONS.toLocaleString()} questions
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {language && difficulty && (
        <QuizPlayer
          open={playerOpen}
          language={language}
          difficulty={difficulty}
          onClose={handleClosePlayer}
        />
      )}
    </section>
  );
}

/* ─── Step header ───────────────────────────────────────────────────── */

interface StepHeaderProps {
  step: string;
  title: string;
  done: boolean;
  accent: string;
  disabled?: boolean;
}

function StepHeader({ step, title, done, accent, disabled = false }: StepHeaderProps) {
  return (
    <div className={`flex items-center gap-3.5 ${disabled ? "opacity-50" : ""}`}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-display text-[13px] font-bold transition-colors duration-300"
        style={{
          background: done ? `${accent}1F` : "hsl(var(--muted))",
          borderColor: done ? `${accent}44` : "hsl(var(--border))",
          color: done ? accent : "hsl(var(--muted-foreground))",
        }}
      >
        {done ? <Check size={15} strokeWidth={3} /> : step}
      </span>
      <h3 className="font-display text-lg font-bold tracking-tight md:text-xl">{title}</h3>
    </div>
  );
}
