import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, CornerDownRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { HeroStage } from "@/components/marketing/HeroStage";
import { ProofMarquee } from "@/components/marketing/ProofMarquee";
import { ScrollStory } from "@/components/marketing/ScrollStory";
import { PathExplorer } from "@/components/marketing/PathExplorer";
import { CapabilityField } from "@/components/marketing/CapabilityField";
import { SectionHead } from "@/components/marketing/SectionHead";
import { Counter } from "@/components/marketing/Counter";
import { PRODUCT_FACTS } from "@/components/marketing/content";
import "@/styles/landing.css";

/**
 * Public landing page — the front door of AlgoGuru.
 *
 * `/` is public; a signed-in visitor is redirected to their workspace at
 * `/home`. Composition: a two-column hero with a 3D product stage, then a
 * sticky scroll narrative, the capability bento, the prerequisite path, a
 * typographic count band, and an asymmetric closing CTA.
 *
 * Every figure on this page is counted from the shipped content files
 * (see components/marketing/content.ts) — no invented logos, users or ratings.
 */

const HERO_FACTS: { term: string; value: string }[] = [
  {
    term: "Practice problems",
    value: `${PRODUCT_FACTS.problems} with difficulty labels`,
  },
  {
    term: "DSA lessons",
    value: `${PRODUCT_FACTS.lessons} across ${PRODUCT_FACTS.tracks} tracks`,
  },
  { term: "Playground", value: PRODUCT_FACTS.playgroundLanguages.join(" · ") },
];

const STATS = [
  {
    value: PRODUCT_FACTS.problems,
    label: "Practice problems",
    note: `${PRODUCT_FACTS.easy} easy · ${PRODUCT_FACTS.medium} medium · ${PRODUCT_FACTS.hard} hard`,
  },
  {
    value: PRODUCT_FACTS.lessons,
    label: "DSA lessons",
    note: `Across ${PRODUCT_FACTS.tracks} prerequisite-ordered tracks`,
  },
  {
    value: 22,
    label: "Core Java topics",
    note: "Plus Spring Boot and system design sets",
  },
  {
    value: PRODUCT_FACTS.playgroundLanguages.length,
    label: "Languages in the sandbox",
    note: PRODUCT_FACTS.playgroundLanguages.join(", "),
  },
];

export default function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // A signed-in visitor should land in their workspace, not on the pitch.
  useEffect(() => {
    if (!loading && session) navigate("/home", { replace: true });
  }, [loading, navigate, session]);

  if (loading) return <AppLoadingScreen label="Opening AlgoGuru" />;
  if (session) return <AppLoadingScreen label="Opening your workspace" />;

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <div className="lp landing-root relative min-h-[100dvh] bg-[hsl(var(--surface-page))] text-foreground">
      <a href="#landing-main" className="skip-link">
        Skip to content
      </a>
      <div className="lp-noise" aria-hidden="true" />
      <div className="lp-vignette" aria-hidden="true" />
      <LandingNav />

      <main id="landing-main" className="relative">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-hero-grid" aria-hidden="true" />
          <div className="lp-hero-bloom" aria-hidden="true" />

          <div className="lp-shell relative pb-14 pt-[calc(var(--header-height)+3.25rem)] sm:pb-16 sm:pt-[calc(var(--header-height)+4.5rem)]">
            <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-12">
              {/* Headline — spans the wide column; the display size is tuned to
                  the column, not to the viewport, so no line can clip. */}
              <div className="lg:col-span-12 xl:col-span-8">
                <p className="lp-up inline-flex items-center gap-2 border border-line bg-[hsl(var(--surface-chrome))] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground [--lp-delay:60ms]">
                  <span aria-hidden="true" className="h-1 w-1 bg-primary" />
                  The algorithm workspace
                  <span aria-hidden="true" className="text-muted-foreground">
                    /
                  </span>
                  <span className="text-foreground/70">Free</span>
                </p>

                <h1 className="lp-display mt-6 text-[clamp(2.5rem,1.15rem+3.7vw,4.85rem)] text-foreground">
                  <span
                    className="lp-mask"
                    style={{ "--lp-delay": "140ms" } as React.CSSProperties}
                  >
                    <span>Read the idea.</span>
                  </span>
                  <span
                    className="lp-mask"
                    style={{ "--lp-delay": "250ms" } as React.CSSProperties}
                  >
                    <span>Write the code.</span>
                  </span>
                  <span
                    className="lp-mask"
                    style={{ "--lp-delay": "360ms" } as React.CSSProperties}
                  >
                    <span className="lp-serif text-[hsl(var(--accent))]">
                      Keep the skill.
                    </span>
                  </span>
                </h1>
              </div>

              {/* Contents — an editorial index, and a real shortcut into the page. */}
              <nav
                aria-label="On this page"
                className="hidden flex-col justify-end gap-1 pb-1 xl:col-span-4 xl:flex"
              >
                <p className="lp-index border-b border-line pb-2 text-right uppercase tracking-[0.16em]">
                  Contents
                </p>
                {[
                  { id: "session", label: "A session, end to end" },
                  { id: "workspace", label: "Inside the workspace" },
                  { id: "path", label: "The path" },
                  { id: "numbers", label: "By the numbers" },
                ].map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollTo(item.id)}
                    className="group flex items-center justify-end gap-3 py-1.5 text-right text-[12.5px] text-muted-foreground transition-colors duration-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-px w-0 bg-primary transition-[width] duration-2 group-hover:w-4" />
                    {item.label}
                    <span className="lp-index w-4 text-right tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Body copy, actions, facts */}
              <div className="lg:col-span-5">
                <p className="lp-up max-w-[42ch] text-[14px] leading-[1.75] text-muted-foreground [--lp-delay:470ms]">
                  One window for data structures, algorithms and Java
                  interviews: prerequisite-ordered lessons, a real editor with
                  test runs, complexity written next to the code, and progress
                  stored against your account.
                </p>

                <div className="lp-up mt-7 flex flex-wrap items-center gap-2.5 [--lp-delay:560ms]">
                  <Link to="/auth?mode=signup" className="lp-cta group">
                    Create your workspace
                    <ArrowRight size={15} data-arrow aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollTo("session")}
                    className="lp-ghost group"
                  >
                    <ArrowDown
                      size={14}
                      className="text-muted-foreground transition-transform duration-2 group-hover:translate-y-0.5"
                      aria-hidden="true"
                    />
                    See a session
                  </button>
                </div>

                <dl className="lp-up mt-9 max-w-[24rem] border-t border-line [--lp-delay:660ms]">
                  {HERO_FACTS.map((fact) => (
                    <div
                      key={fact.term}
                      className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2"
                    >
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-muted-foreground">
                        {fact.term}
                      </dt>
                      <dd className="text-right text-[11.5px] leading-[1.4] text-foreground/85">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="lg:col-span-7">
                <HeroStage />
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between gap-6 sm:mt-16">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-8 bg-line" />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  Built on shipped content, not a pitch deck
                </span>
              </div>
              <button
                type="button"
                onClick={() => scrollTo("session")}
                className="hidden items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground transition-colors duration-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
              >
                Scroll
                <CornerDownRight size={11} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <ProofMarquee />

        {/* ── 01 · A session ───────────────────────────────────────── */}
        <section className="lp-shell py-16 sm:py-20">
          <SectionHead
            id="session"
            index="01"
            kicker="A session, end to end"
            title={
              <>
                Four moves,{" "}
                <span className="lp-serif text-[hsl(var(--accent))]">
                  in order.
                </span>
              </>
            }
            description="Understanding, solving and reviewing are three different kinds of work. AlgoGuru keeps them on one surface so you are never hunting for the tab where you left the thread."
            aside={
              <p className="border-l border-primary/50 pl-3 font-mono text-[10.5px] leading-[1.7] text-muted-foreground">
                Discover → understand → solve → complexity → progress. The same
                loop for all {PRODUCT_FACTS.tracks} tracks.
              </p>
            }
          />
          <div className="mt-8 sm:mt-10">
            <ScrollStory />
          </div>
        </section>

        {/* ── 02 · Inside the workspace ────────────────────────────── */}
        <section className="lp-shell py-16 sm:py-20">
          <SectionHead
            id="workspace"
            index="02"
            kicker="Inside the workspace"
            title={
              <>
                The tools{" "}
                <span className="lp-serif text-[hsl(var(--accent))]">are</span>{" "}
                the lesson.
              </>
            }
            description="Four pieces of interface you will use on every problem. No dashboards, no streaks to protect — just the things a working engineer needs to go from statement to defensible solution."
            align="split"
          />
          <div className="mt-10">
            <CapabilityField />
          </div>
        </section>

        {/* ── 03 · The path ────────────────────────────────────────── */}
        <section className="lp-shell py-16 sm:py-20">
          <SectionHead
            id="path"
            index="03"
            kicker="The path"
            title={
              <>
                Nothing unlocks{" "}
                <span className="lp-serif text-[hsl(var(--accent))]">
                  early.
                </span>
              </>
            }
            description="The DSA path is ordered by prerequisite, not by popularity. Pick a node to see what it contains and what it assumes you already know."
          />
          <div className="mt-10">
            <PathExplorer />
          </div>
        </section>

        {/* ── 04 · By the numbers ──────────────────────────────────── */}
        <section
          id="numbers"
          className="scroll-mt-24 border-y border-line bg-[hsl(var(--surface-chrome)/0.55)]"
        >
          <div className="lp-shell py-14 sm:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="lp-kicker">04 / By the numbers</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Counted from the content files in the repository
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-x-0">
              {STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className={
                    index === 0
                      ? "md:pr-6"
                      : "md:border-l md:border-line md:px-6 md:last:pr-0"
                  }
                >
                  <p className="lp-stat text-foreground">
                    <Counter value={stat.value} />
                  </p>
                  <p className="mt-3 border-t border-line pt-2.5 text-[12px] font-medium text-foreground/85">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-[11px] leading-[1.5] text-muted-foreground">
                    {stat.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing CTA ──────────────────────────────────────────── */}
        <section className="lp-final">
          <div className="lp-final-grid" aria-hidden="true" />
          <div className="lp-final-bloom" aria-hidden="true" />
          <div className="lp-shell relative py-20 sm:py-28">
            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-16">
              <div>
                <p className="lp-kicker">Start here</p>
                <h2 className="lp-display mt-5 max-w-[17ch] text-[clamp(2.1rem,1.1rem+3.3vw,3.85rem)] text-foreground">
                  Pick a track.
                  <br />
                  Finish one lesson.
                  <br />
                  <span className="lp-serif text-[hsl(var(--accent))]">
                    Then decide.
                  </span>
                </h2>
              </div>

              <div className="lg:pb-2">
                <p className="max-w-[40ch] text-[13.5px] leading-[1.8] text-muted-foreground">
                  Create an account and the first lesson of your chosen track is
                  already open: concept page, worked example, then a problem in
                  the editor. Nothing to install and no card.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link to="/auth?mode=signup" className="lp-cta group">
                    Create your workspace
                    <ArrowRight size={15} data-arrow aria-hidden="true" />
                  </Link>
                  <Link to="/auth" className="lp-ghost group">
                    Sign in
                    <span className="lp-kbd ml-1">
                      <CornerDownRight size={8} aria-hidden="true" />
                    </span>
                  </Link>
                </div>

                <p className="mt-5 font-mono text-[10px] leading-[1.7] text-muted-foreground">
                  Free to start · progress and notes are stored against your own
                  account · sign-in with email or Google.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
