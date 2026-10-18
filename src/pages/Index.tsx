import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Maximize2,
  PanelLeft,
  Play,
  Shield,
  Shuffle,
} from "lucide-react";
import "@/styles/landing.css";
import { RoadmapFullscreenOverlay } from "@/components/roadmap/RoadmapFullscreenOverlay";
import { QuizSection } from "@/components/quiz/QuizSection";
import { useHomeSidebar } from "@/contexts/HomeSidebarContext";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";
import { practiceData } from "@/data/practiceData";
import { topics } from "@/data/topics";

/* Real catalogue numbers — derived, never hand-written marketing figures. */
const PROBLEM_COUNT = practiceData.reduce(
  (total, topic) => total + topic.subtopics.reduce((sum, sub) => sum + sub.problems.length, 0),
  0,
);
const TRACK_COUNT = topics.length;

const TRACKS = [
  {
    id: "arrays",
    no: "01",
    title: "Data Structures",
    meta: "Pattern-wise",
    route: "/arrays",
    desc: "Arrays, strings, stacks, trees, graphs and DP — taught by the pattern an interviewer is listening for, not by chapter order.",
  },
  {
    id: "practice",
    no: "02",
    title: "Practice Sheet",
    meta: `${PROBLEM_COUNT} problems`,
    route: "/practice",
    desc: "A curated problem sheet with difficulty ramps, company tags and annotated editorials for the core patterns.",
  },
  {
    id: "java-advanced",
    no: "03",
    title: "Advanced Java",
    meta: "9 deep topics",
    route: "/java-advanced",
    desc: "Reflection, JVM internals, garbage collection and Java 17+ — the theory that separates a senior interview from a screening call.",
  },
  {
    id: "system-design",
    no: "04",
    title: "System Design",
    meta: "Full roadmap",
    route: "/interview/java/system-design",
    desc: "Work from a single service to sharded, cached, observable systems. Trade-offs first; boxes and arrows second.",
  },
  {
    id: "interview",
    no: "05",
    title: "Interview Prep",
    meta: "Real experiences",
    route: "/interview",
    desc: "Spring Boot, SQL and language-specific rounds, plus accounts from candidates who sat the interviews you are preparing for.",
  },
  {
    id: "daily",
    no: "06",
    title: "Daily Problem",
    meta: "Updated daily",
    route: "/problem-solver",
    desc: "One fresh problem a day with a built-in editor, hidden test cases and a Guru that explains the approach after you submit.",
  },
];

const TOPIC_STRIP = [
  "Arrays", "Hashing", "Two pointers", "Sliding window", "Stacks", "Queues",
  "Linked lists", "Binary trees", "BST", "Heaps", "Graphs", "Backtracking",
  "Greedy", "Dynamic programming", "Tries", "Bit manipulation", "Segment trees",
];

const HERO_BULLETS = ["Free · no paywall", "Editorials for core patterns", "Java · C++ · Python"];

const PROOF = [
  { value: `${PROBLEM_COUNT}`, label: "Curated problems" },
  { value: `${TRACK_COUNT}`, label: "Topic tracks" },
  { value: "3", label: "Languages" },
  { value: "Free", label: "Every path" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── The product window in the hero ─────────────────────────────
   A faithful miniature of the real problem-solver surface. It is
   static markup rather than an iframe or canvas, so it costs
   nothing to paint and stays crisp at any zoom level. */
function SolverWindow() {
  return (
    <div className="lp-window-stack">
      <div className="lp-window" aria-label="AlgoGuru problem solver preview">
        <div className="lp-winbar">
          <span className="lp-win-file">
            <AlgoGuruMark size={15} title={null} />
            Problem Solver
          </span>
          <span className="lp-win-right">
            <span className="lp-live" aria-hidden="true" />
            Java 17
          </span>
        </div>

        <div className="lp-tabbar" role="presentation">
          <span className="lp-tab" data-active="true">Description</span>
          <span className="lp-tab">Editorial</span>
          <span className="lp-tab">Guru AI</span>
          <span className="lp-tab">Submissions</span>
        </div>

        <div className="lp-problem">
          <div className="lp-problem-top">
            <span className="lp-problem-no">#1</span>
            <h3 className="lp-problem-title">Two Sum</h3>
            <span className="lp-diff">Easy</span>
          </div>
          <p>
            Return the indices of the two numbers that add up to <code>target</code>. Exactly one
            solution exists.
          </p>
        </div>

        <div className="lp-codebar">
          <span>Solution.java</span>
          <span>
            <span className="lp-kbd">⌘</span> <span className="lp-kbd">↵</span>
          </span>
        </div>

        <pre className="lp-code" aria-label="Java solution to Two Sum">
          <span className="lp-line"><span className="lp-ln">1</span><span><span className="tok-key">class</span> Solution {"{"}</span></span>
          <span className="lp-line"><span className="lp-ln">2</span><span>  <span className="tok-key">public</span> <span className="tok-type">int</span>[] twoSum(<span className="tok-type">int</span>[] nums, <span className="tok-type">int</span> target) {"{"}</span></span>
          <span className="lp-line"><span className="lp-ln">3</span><span>    Map&lt;<span className="tok-type">Integer</span>, <span className="tok-type">Integer</span>&gt; seen = <span className="tok-key">new</span> HashMap&lt;&gt;();</span></span>
          <span className="lp-line"><span className="lp-ln">4</span><span>    <span className="tok-key">for</span> (<span className="tok-type">int</span> i = 0; i &lt; nums.length; i++) {"{"}</span></span>
          <span className="lp-line"><span className="lp-ln">5</span><span>      <span className="tok-type">int</span> need = target - nums[i];</span></span>
          <span className="lp-line"><span className="lp-ln">6</span><span>      <span className="tok-key">if</span> (seen.containsKey(need))</span></span>
          <span className="lp-line"><span className="lp-ln">7</span><span>        <span className="tok-key">return</span> <span className="tok-key">new</span> <span className="tok-type">int</span>[] {"{"} seen.get(need), i {"}"};</span></span>
          <span className="lp-line"><span className="lp-ln">8</span><span>      seen.put(nums[i], i);</span></span>
          <span className="lp-line"><span className="lp-ln">9</span><span>    {"}"}</span></span>
          <span className="lp-line"><span className="lp-ln">10</span><span>    <span className="tok-key">return</span> <span className="tok-key">new</span> <span className="tok-type">int</span>[] {"{}"};</span></span>
          <span className="lp-line"><span className="lp-ln">11</span><span>  {"}"}</span></span>
          <span className="lp-line"><span className="lp-ln">12</span><span>{"}"}</span></span>
        </pre>

        <div className="lp-runbar">
          <span className="lp-pass">
            <Check size={12} strokeWidth={3} /> Accepted
          </span>
          <span>58 / 58 tests</span>
          <span>3 ms</span>
          <span className="lp-chip">O(n) time · O(n) space</span>
        </div>
      </div>
    </div>
  );
}

/* ── Three-up workbench ─────────────────────────────────────────
   Each panel is a real feature rendered as a small, honest mock:
   editorial code, the roadmap graph, and the Guru chat. */
function EditorialMock() {
  return (
    <div className="lp-mock-editor">
      <div className="lp-mock-tabs">
        <span data-on="true">Editorial</span>
        <span>Guru</span>
        <span>Notes</span>
      </div>
      <div className="lp-mock-code">
        <span className="tok-key">class</span> Solution {"{"}{"\n"}
        {"  "}<span className="tok-key">int</span> maxSubArray(<span className="tok-type">int</span>[] a) {"{"}{"\n"}
        {"    "}<span className="tok-type">int</span> best = a[0], cur = a[0];{"\n"}
        {"    "}<span className="tok-key">for</span> (<span className="tok-type">int</span> i = 1; i &lt; a.length; i++) {"{"}{"\n"}
        {"      "}cur = Math.max(a[i], cur + a[i]);{"\n"}
        {"      "}best = Math.max(best, cur);{"\n"}
        {"    "}{"}"}{"\n"}
        {"    "}<span className="tok-key">return</span> best;{"\n"}
        {"  "}{"}"}{"\n"}
        {"}"}
      </div>
      <div className="lp-mock-note">
        <span><b>▍Note</b> — Kadane keeps one decision per index: extend the run or start over.</span>
      </div>
    </div>
  );
}

function RoadmapMock() {
  return (
    <div className="lp-mock-map" aria-hidden="true">
      <svg viewBox="0 0 240 170">
        <path className="lp-map-edge lp-map-edge--live" d="M120 24 V54" />
        <path className="lp-map-edge" d="M120 54 C 70 62, 62 86, 56 108" />
        <path className="lp-map-edge" d="M120 54 C 170 62, 178 86, 184 108" />
        <path className="lp-map-edge" d="M56 108 C 50 126, 50 136, 50 146" />
        <path className="lp-map-edge" d="M184 108 C 190 126, 190 136, 190 146" />
        <path className="lp-map-edge" d="M120 54 V146" />
        <circle className="lp-map-node lp-map-node--live" cx="120" cy="24" r="7" />
        <circle className="lp-map-node" cx="120" cy="54" r="5.5" />
        <circle className="lp-map-node" cx="56" cy="108" r="5.5" />
        <circle className="lp-map-node" cx="184" cy="108" r="5.5" />
        <circle className="lp-map-node" cx="50" cy="148" r="5.5" />
        <circle className="lp-map-node" cx="120" cy="148" r="5.5" />
        <circle className="lp-map-node" cx="190" cy="148" r="5.5" />
        <text className="lp-map-label lp-map-label--live" x="120" y="12" textAnchor="middle">Arrays</text>
        <text className="lp-map-label" x="120" y="70" textAnchor="middle">Patterns</text>
        <text className="lp-map-label" x="42" y="100" textAnchor="middle">Trees</text>
        <text className="lp-map-label" x="198" y="100" textAnchor="middle">Graphs</text>
        <text className="lp-map-label" x="50" y="164" textAnchor="middle">DP</text>
        <text className="lp-map-label" x="120" y="164" textAnchor="middle">Greedy</text>
        <text className="lp-map-label" x="190" y="164" textAnchor="middle">Heaps</text>
      </svg>
    </div>
  );
}

function GuruMock() {
  return (
    <div className="lp-mock-chat">
      <div className="lp-bubble lp-bubble--user">
        Why is my two-pointer solution O(n²) on duplicates?
      </div>
      <div className="lp-bubble lp-bubble--guru">
        <span className="lp-bubble-head">
          <img src={`${import.meta.env.BASE_URL}brand/guru-ai.png`} alt="" aria-hidden="true" />
          Guru
        </span>
        Your inner <code>while</code> never advances past equal neighbours, so the pair is re-tested.
        Move both pointers after a match.
      </div>
      <div className="lp-mock-input">
        <span>Ask about a problem…</span>
        <kbd>↵</kbd>
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const { homeSidebarOpen, toggleHomeSidebar } = useHomeSidebar();
  const reduceMotion = useReducedMotion();

  const openRoadmap = () => setRoadmapOpen(true);

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.65, ease: EASE },
        };

  const reveal = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-70px" },
        transition: { duration: 0.6, ease: EASE },
      };

  const scrollToTracks = () =>
    document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="lp">
      <div className="lp-grain" aria-hidden="true" />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="lp-hero">
        <svg className="lp-hero-glyph" viewBox="0 0 64 64" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 46 L32 18 L47 46" />
            <path d="M22.09 36.5 H41.91" />
            <circle cx="17" cy="46" r="1.6" />
            <circle cx="32" cy="18" r="1.6" />
            <circle cx="47" cy="46" r="1.6" />
          </g>
        </svg>

        <div className="lp-shell">
          <motion.div className="lp-hero-meta" {...fadeUp(0)}>
            <span className="lp-status">
              <span className="lp-dot" aria-hidden="true" />
              Free · Open workspace
            </span>
            <span>Built for engineers who are done watching tutorials</span>
          </motion.div>

          <div className="lp-hero-grid">
            <div>
              <motion.h1 className="lp-h1" {...fadeUp(0.05)}>
                Master the patterns.
                <span className="lp-h1-em">Walk in ready.</span>
              </motion.h1>

              <motion.p className="lp-hero-copy" {...fadeUp(0.12)}>
                AlgoGuru is a focused workspace for data structures, system design and the
                Java, C++ and Python questions that actually come up. Learn the pattern once,
                then practise it under the same conditions as the real round.
              </motion.p>

              <motion.div className="lp-hero-actions" {...fadeUp(0.18)}>
                <button type="button" className="lp-btn lp-btn--solid" onClick={() => navigate("/practice")}>
                  Open the practice sheet
                  <ArrowRight size={17} data-shift="true" />
                </button>
                <button type="button" className="lp-btn lp-btn--line" onClick={() => navigate("/problem-solver")}>
                  <Play size={15} fill="currentColor" className="text-primary" />
                  Today’s problem
                </button>
              </motion.div>

              <motion.div className="lp-hero-bullets" {...fadeUp(0.24)}>
                {HERO_BULLETS.map((item) => (
                  <span key={item}>
                    <Check size={13} strokeWidth={3} />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="lp-figure-wrap"
              initial={reduceMotion ? undefined : { opacity: 0, y: 26 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.75, ease: EASE }}
            >
              <SolverWindow />
              <div className="lp-figure">
                <span>Fig. 01 — Problem solver</span>
                <span>Accepted · Java 17</span>
              </div>
            </motion.div>
          </div>

          {/* Proof band */}
          <motion.dl className="lp-proof" {...reveal}>
            {PROOF.map((item) => (
              <div key={item.label} className="lp-proof-item">
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </section>

      {/* ── TOPIC STRIP ──────────────────────────────────────── */}
      <div className="lp-strip" aria-hidden="true">
        <div className="lp-shell lp-strip-inner">
          <span className="lp-strip-label">Curriculum</span>
          <span className="lp-strip-sep" />
          {TOPIC_STRIP.map((topic) => (
            <Fragment key={topic}>
              <span>{topic}</span>
              <span className="lp-strip-sep" />
            </Fragment>
          ))}
        </div>
      </div>

      {/* ── TRACK INDEX ──────────────────────────────────────── */}
      <section id="tracks" className="lp-band">
        <div className="lp-shell lp-section">
          <motion.div className="lp-section-head" {...reveal}>
            <div>
              <p className="lp-kicker">The index</p>
              <h2 className="lp-h2" style={{ marginTop: "0.9rem" }}>
                Six tracks. One <span className="lp-serif">route</span> to the offer.
              </h2>
            </div>
            <p className="lp-lede">
              Start anywhere, but start. Every track is written by the same person, follows the
              same voice, and ends with problems you can attempt immediately.
            </p>
          </motion.div>

          <div className="lp-index">
            <div className="lp-index-head">
              <span>No. / Track / Scope</span>
              <button
                type="button"
                className="lp-index-toggle"
                onClick={toggleHomeSidebar}
                aria-expanded={homeSidebarOpen}
                aria-label={homeSidebarOpen ? "Hide the topic panel" : "Show the topic panel"}
              >
                <PanelLeft size={13} />
                {homeSidebarOpen ? "Hide panel" : "Browse all topics"}
              </button>
            </div>

            {TRACKS.map((track, index) => (
              <motion.a
                key={track.id}
                href={track.route}
                className="lp-row"
                onClick={(event) => {
                  event.preventDefault();
                  navigate(track.route);
                }}
                {...(reduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 14 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "-40px" },
                      transition: { delay: index * 0.04, duration: 0.5, ease: EASE },
                    })}
              >
                <span className="lp-row-no">{track.no}</span>
                <span className="lp-row-body">
                  <h3 className="lp-row-title">
                    {track.title}
                    <span className="lp-row-meta">— {track.meta}</span>
                  </h3>
                  <p className="lp-row-desc">{track.desc}</p>
                </span>
                <span className="lp-row-arrow" aria-hidden="true">
                  <ArrowUpRight size={15} />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKBENCH ────────────────────────────────────────── */}
      <section className="lp-band">
        <div className="lp-shell lp-section">
          <motion.div className="lp-section-head" {...reveal}>
            <div>
              <p className="lp-kicker">The workbench</p>
              <h2 className="lp-h2" style={{ marginTop: "0.9rem" }}>
                Learn, then prove it — in the same tab.
              </h2>
            </div>
            <p className="lp-lede">
              Reading and solving are not separate products here. The editor, the editorial and
              the assistant live beside the problem, so you never lose the thread.
            </p>
          </motion.div>

          <motion.div className="lp-workbench" {...reveal}>
            <article className="lp-cell">
              <div className="lp-cell-visual">
                <EditorialMock />
              </div>
              <div className="lp-cell-copy">
                <span className="lp-cell-num">01 — READING</span>
                <h3 className="lp-cell-title">Annotated editorials for the core patterns</h3>
                <p className="lp-cell-text">
                  Not a link to a video. A short, annotated explanation of the pattern and the
                  exact <code>O(·)</code> trade-off you are making.
                </p>
              </div>
            </article>

            <article className="lp-cell">
              <div className="lp-cell-visual">
                <RoadmapMock />
              </div>
              <div className="lp-cell-copy">
                <span className="lp-cell-num">02 — SEQUENCING</span>
                <h3 className="lp-cell-title">A roadmap that admits dependencies</h3>
                <p className="lp-cell-text">
                  Trees before heaps, graphs before DP. The roadmap shows what unlocks what, so
                  you are never guessing the next step.
                </p>
              </div>
            </article>

            <article className="lp-cell">
              <div className="lp-cell-visual">
                <GuruMock />
              </div>
              <div className="lp-cell-copy">
                <span className="lp-cell-num">03 — UNBLOCKING</span>
                <h3 className="lp-cell-title">A tutor that reads the problem with you</h3>
                <p className="lp-cell-text">
                  Guru AI is scoped to the question on screen — hints that reference your own
                  code instead of a generic answer from the internet.
                </p>
              </div>
            </article>
          </motion.div>
        </div>
      </section>

      {/* ── QUIZ / CONTEST ───────────────────────────────────── */}
      <QuizSection />

      {/* ── EDITORIAL NOTE ───────────────────────────────────── */}
      <section className="lp-note">
        <div className="lp-shell">
          <div className="lp-note-grid">
            <motion.p className="lp-kicker" {...reveal}>
              Why this exists
            </motion.p>
            <motion.div className="lp-note-body" {...reveal}>
              <blockquote className="lp-note-quote">
                “I built AlgoGuru because I was tired of preparing in twelve tabs — a video here,
                a solution there, a half-finished sheet somewhere else.”
              </blockquote>
              <p className="lp-note-text">
                Everything on this site exists because it was useful during a real preparation
                cycle: the problems, the editorial notes, the roadmap order, even the contest mode
                that locks the screen. Nothing is here to fill a marketing page. If a section stops
                helping, it gets removed.
              </p>
              <div className="lp-note-sign">Aritra — creator of AlgoGuru</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section>
        <div className="lp-shell lp-cta-wrap">
          <motion.div className="lp-cta" {...reveal}>
            <svg className="lp-cta-glyph" viewBox="0 0 64 64" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 46 L32 18 L47 46" />
                <path d="M22.09 36.5 H41.91" />
              </g>
            </svg>
            <p className="lp-cta-kicker">Start where you are</p>
            <h2 className="lp-cta-title">
              The offer follows the <em>practice</em>, not the other way round.
            </h2>
            <p className="lp-cta-copy">
              Pick one track, solve three problems today, and let tomorrow be about the fourth.
              No subscription, no upsell at the last step.
            </p>
            <div className="lp-cta-actions">
              <button type="button" className="lp-btn lp-btn--inv" onClick={scrollToTracks}>
                Choose a track
                <ArrowRight size={17} data-shift="true" />
              </button>
              <button type="button" className="lp-btn lp-btn--ghost-inv" onClick={openRoadmap}>
                View the roadmap
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <RoadmapFullscreenOverlay open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
    </main>
  );
}
