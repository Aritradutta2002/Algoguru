import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowRight, CircleDot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoadingScreen } from "@/components/layout/RouteFallback";
import { FlipTerm } from "@/components/motion/FlipTerm";
import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { WorkspacePreview } from "@/components/marketing/WorkspacePreview";
import { SessionWalkthrough } from "@/components/marketing/SessionWalkthrough";
import { PathExplorer } from "@/components/marketing/PathExplorer";
import { CapabilityField } from "@/components/marketing/CapabilityField";
import { PRODUCT_FACTS } from "@/components/marketing/content";
import "@/styles/landing.css";

/**
 * Public landing page — the front door of AlgoGuru.
 *
 * Previously `/` was gated behind authentication, so the marketing page was
 * only ever seen by people who had already signed up. `/` is now public and
 * signed-in visitors are routed straight to their workspace at `/home`.
 */

const ROTATING_PROBLEMS = [
  "Two Sum",
  "Trapping Rain Water",
  "Merge K Sorted Lists",
  "Longest Palindromic Substring",
];

function SectionHead({
  index,
  eyebrow,
  title,
  description,
  aside,
  id,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="grid scroll-mt-24 gap-6 border-t border-line pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-14"
    >
      <div>
        <p className="ws-eyebrow">
          {index} — {eyebrow}
        </p>
        <h2 className="ws-display-2 mt-3 max-w-[24ch] text-foreground">
          {title}
        </h2>
      </div>
      <div className="flex flex-col justify-end gap-4">
        <p className="max-w-[46ch] text-[13.5px] leading-6 text-muted-foreground">
          {description}
        </p>
        {aside}
      </div>
    </div>
  );
}

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
    <div className="landing-root min-h-[100dvh] bg-[hsl(var(--surface-page))] text-foreground">
      <a href="#landing-main" className="skip-link">
        Skip to content
      </a>
      <LandingNav />

      <main id="landing-main">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="ws-grid-texture absolute inset-x-0 top-0 h-[520px]"
          />
          <div className="relative mx-auto w-full max-w-content px-5 pb-14 pt-28 sm:px-8 sm:pt-32">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-16">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  <CircleDot
                    size={10}
                    aria-hidden="true"
                    className="text-primary"
                  />
                  <span>Now in the workspace</span>
                  <span aria-hidden="true" className="text-muted-foreground/40">
                    /
                  </span>
                  <FlipTerm
                    terms={ROTATING_PROBLEMS}
                    className="max-w-[26ch] font-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/80"
                  />
                </div>

                <h1 className="mt-5 max-w-[19ch] text-balance font-display text-[clamp(2.5rem,1.15rem+4.2vw,4.35rem)] font-semibold leading-[0.98] tracking-[-0.038em]">
                  Learn algorithms in a workspace built for{" "}
                  <span className="ws-editorial text-[1.04em] text-primary">
                    deep work.
                  </span>
                </h1>

                <p className="mt-6 max-w-[52ch] text-[15px] leading-7 text-muted-foreground">
                  AlgoGuru is a focused study environment for data structures
                  and algorithms: a prerequisite-ordered path, concept pages you
                  can revise, and a real code editor with test runs. Read,
                  solve, review, track — in one place.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/auth?mode=signup"
                    className="group inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-[background-color,transform] duration-1 hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-page))]"
                  >
                    Create a free account
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-2 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollTo("workspace")}
                    className="inline-flex h-11 items-center gap-2 rounded-sm border border-line bg-[hsl(var(--surface-chrome))] px-4 text-[14px] font-medium text-foreground transition-colors duration-1 hover:border-[hsl(var(--surface-line-strong))] hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    See the workspace
                    <ArrowDown
                      size={14}
                      className="text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground/80">
                  Free · no credit card · Google sign-in or email
                </p>
              </div>

              {/* Truthful product facts, drawn from the shipped data files. */}
              <aside
                aria-label="What is inside"
                className="lg:border-l lg:border-line lg:pl-8"
              >
                <p className="ws-eyebrow">Inside</p>
                <dl className="mt-3 divide-y divide-line/70">
                  <div className="py-3 first:pt-0">
                    <dd className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                      {PRODUCT_FACTS.problems}
                    </dd>
                    <dt className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
                      curated practice problems, linked to LeetCode and
                      GeeksforGeeks
                    </dt>
                  </div>
                  <div className="py-3">
                    <dd className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                      {PRODUCT_FACTS.lessons}
                    </dd>
                    <dt className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
                      lessons across {PRODUCT_FACTS.tracks} DSA tracks, in
                      prerequisite order
                    </dt>
                  </div>
                  <div className="py-3 pb-0">
                    <dd className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                      22
                    </dd>
                    <dt className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
                      Java theory topics, plus a Spring Boot interview track
                    </dt>
                  </div>
                </dl>

                <div className="mt-5 border-t border-line pt-3">
                  <p className="ws-eyebrow">Problem set by difficulty</p>
                  <div
                    className="mt-2 flex h-1.5 overflow-hidden rounded-pill"
                    role="img"
                    aria-label={`${PRODUCT_FACTS.easy} easy, ${PRODUCT_FACTS.medium} medium and ${PRODUCT_FACTS.hard} hard problems`}
                  >
                    <span
                      className="h-full bg-success"
                      style={{
                        width: `${(PRODUCT_FACTS.easy / PRODUCT_FACTS.problems) * 100}%`,
                      }}
                    />
                    <span
                      className="h-full bg-warning"
                      style={{
                        width: `${(PRODUCT_FACTS.medium / PRODUCT_FACTS.problems) * 100}%`,
                      }}
                    />
                    <span
                      className="h-full bg-destructive"
                      style={{
                        width: `${(PRODUCT_FACTS.hard / PRODUCT_FACTS.problems) * 100}%`,
                      }}
                    />
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-pill bg-success"
                      />
                      {PRODUCT_FACTS.easy} easy
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-pill bg-warning"
                      />
                      {PRODUCT_FACTS.medium} medium
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-pill bg-destructive"
                      />
                      {PRODUCT_FACTS.hard} hard
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Product window ─────────────────────────────────────── */}
        <section id="workspace" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-content px-5 sm:px-8">
            <WorkspacePreview />
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10.5px] text-muted-foreground">
                Product preview · Arrays → Two Sum · sample data, not your
                progress
              </p>
              <Link
                to="/auth"
                className="inline-flex w-fit items-center gap-1.5 rounded-xs font-mono text-[10.5px] text-foreground/80 transition-colors duration-1 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open the real workspace
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── A session ──────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-content px-5 py-20 sm:px-8 sm:py-24">
          <SectionHead
            index="01"
            eyebrow="A session"
            title={
              <>
                Five moves, and the workspace keeps{" "}
                <span className="ws-editorial text-primary">all of them</span>{" "}
                in place.
              </>
            }
            description="Most learners lose more time switching between a tutorial, an editor and a notes app than they do solving. AlgoGuru keeps the loop inside one window — one lesson tree on the left, one document in the middle."
          />
          <div className="mt-10">
            <SessionWalkthrough />
          </div>
        </section>

        {/* ── The path ───────────────────────────────────────────── */}
        <section className="border-y border-line bg-[hsl(var(--surface-chrome))]">
          <div className="mx-auto w-full max-w-content px-5 py-20 sm:px-8 sm:py-24">
            <SectionHead
              index="02"
              eyebrow="The path"
              title={
                <>
                  A prerequisite chain, not an{" "}
                  <span className="ws-editorial text-primary">
                    infinite feed.
                  </span>
                </>
              }
              description="Every track is ordered so nothing assumes a pattern you have not met yet. Completed lessons, the one in progress and the next unlock are visible at a glance — select any node to see what it contains."
            />
            <div className="mt-10">
              <PathExplorer />
            </div>
          </div>
        </section>

        {/* ── Capabilities ───────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-content px-5 py-20 sm:px-8 sm:py-24">
          <SectionHead
            index="03"
            eyebrow="Capabilities"
            id="capabilities"
            title={
              <>
                The parts that matter when you are actually{" "}
                <span className="ws-editorial text-primary">solving.</span>
              </>
            }
            description="No dashboards for the sake of dashboards. These are the four surfaces the product is built around, each shown exactly as it appears inside the app."
          />
          <div className="mt-10">
            <CapabilityField />
          </div>
        </section>

        {/* ── Closing ────────────────────────────────────────────── */}
        <section className="border-t border-line">
          <div className="mx-auto w-full max-w-content px-5 py-20 sm:px-8 sm:py-24">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <p className="ws-eyebrow">Start here</p>
                <h2 className="ws-display-1 mt-4 max-w-[16ch] text-foreground">
                  Open the workspace and finish{" "}
                  <span className="ws-editorial text-primary">
                    one problem.
                  </span>
                </h2>
                <p className="mt-5 max-w-[46ch] text-[14px] leading-7 text-muted-foreground">
                  Create an account and your progress, bookmarks and notes are
                  stored against it. Nothing else is required to begin.
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <Link
                  to="/auth?mode=signup"
                  className="group inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-[background-color,transform] duration-1 hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-page))]"
                >
                  Create a free account
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-2 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex h-9 items-center rounded-sm px-1 text-[13px] font-medium text-muted-foreground underline-offset-4 transition-colors duration-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  I already have an account
                </Link>
                <p className="font-mono text-[10.5px] text-muted-foreground/70">
                  free forever · no card required
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
