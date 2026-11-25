"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight, Heart, Search } from "lucide-react";
import { AlgoGuruLockup } from "@/components/brand/AlgoGuruLockup";
import { Button } from "@/components/ui/button";

export interface FooterProps {
  onSupportClick?: () => void;
}

interface FooterLink {
  label: string;
  href: string;
}

interface FooterNavGroup {
  title: string;
  ariaLabel: string;
  links: readonly FooterLink[];
}

const PORTFOLIO_URL = "https://www.aritrodutta.tech/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

const FOOTER_NAV_GROUPS: readonly FooterNavGroup[] = [
  {
    title: "Workspace",
    ariaLabel: "Workspace",
    links: [
      { label: "DSA Practice", href: "/practice" },
      { label: "Code Playground", href: "/playground" },
      { label: "Problem Solver", href: "/problem-solver" },
      { label: "Coding Contests", href: "/contest" },
      { label: "Notes", href: "/notes" },
    ],
  },
  {
    title: "Curriculum",
    ariaLabel: "Curriculum",
    links: [
      { label: "Arrays & Patterns", href: "/arrays" },
      { label: "Dynamic Programming", href: "/dp" },
      { label: "Advanced Java", href: "/java-advanced" },
      { label: "System Design", href: "/interview/java/system-design" },
      { label: "Interview Hub", href: "/interview" },
    ],
  },
  {
    title: "Paths & Account",
    ariaLabel: "Paths and account",
    links: [
      { label: "Learning Roadmap", href: "/roadmap" },
      { label: "Java Roadmap", href: "/java-roadmap" },
      { label: "Sign in", href: "/auth" },
      { label: "Support", href: "/support" },
      { label: "Buy me a coffee", href: "/buy-me-a-coffee" },
    ],
  },
];

const SOCIAL_LINKS: readonly FooterLink[] = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "LinkedIn", href: LINKEDIN_URL },
  { label: "X (Twitter)", href: TWITTER_URL },
  { label: "Portfolio", href: PORTFOLIO_URL },
];

const PRODUCT_TRACKS = ["DSA", "Java", "System Design", "Contests"] as const;

const FOCUS_RING_CLASS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-void";

const LINK_CLASS = `inline-flex items-center gap-1 rounded-sm text-[13.5px] leading-5 text-muted-foreground transition-colors duration-150 hover:text-foreground ${FOCUS_RING_CLASS}`;

const HEADING_CLASS =
  "text-[13px] font-semibold tracking-[-0.01em] text-foreground";

export function Footer({ onSupportClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const main = document.getElementById("main-content");
    if (main) {
      main.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  const openCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
  };

  return (
    <footer
      aria-label="Site footer"
      className="w-full border-t border-obsidian-border bg-obsidian-void text-foreground"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,3fr)] lg:gap-12">
          {/* Brand & Platform Meta */}
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="AlgoGuru home"
              className={`inline-flex items-center rounded-md text-foreground transition-opacity duration-150 hover:opacity-90 ${FOCUS_RING_CLASS}`}
            >
              <AlgoGuruLockup size={28} title={null} />
            </Link>

            <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground">
              A structured engineering workspace for data structures, Java internals,
              system design, and timed coding interviews.
            </p>

            {/* Operational status & quick command trigger */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <span
                role="status"
                className="inline-flex items-center gap-2 rounded-full border border-obsidian-border bg-obsidian-pane px-2.5 py-1 text-[12px] font-medium text-foreground/90"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-obsidian-success ring-4 ring-obsidian-success/15"
                />
                All systems operational
              </span>

              <Button
                variant="bare"
                size="bare"
                type="button"
                onClick={openCommandPalette}
                aria-label="Quick search (Cmd or Ctrl + K)"
                className={`inline-flex items-center gap-1.5 rounded-full border border-obsidian-border bg-obsidian-pane px-2.5 py-1 text-[12px] font-normal text-muted-foreground transition-colors duration-150 hover:border-foreground/20 hover:text-foreground ${FOCUS_RING_CLASS}`}
              >
                <Search size={12} aria-hidden="true" className="shrink-0 !size-3" />
                <span>Quick search</span>
                <kbd className="rounded border border-obsidian-border bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[10.5px] font-medium leading-none text-foreground/85">
                  ⌘K
                </kbd>
                <span className="text-[11px] text-muted-foreground/80">
                  / Ctrl+K
                </span>
              </Button>
            </div>

            {/* Support action */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSupportClick}
                className="h-8 border-obsidian-border bg-obsidian-pane px-3 text-[12.5px] font-medium text-foreground hover:bg-obsidian-elevated"
              >
                <Heart
                  size={13}
                  className="text-muted-foreground"
                  aria-hidden="true"
                />
                Buy me a coffee
              </Button>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:gap-8">
            {FOOTER_NAV_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.ariaLabel}>
                <h3 className={HEADING_CLASS}>{group.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map(({ label, href }) => (
                    <li key={href}>
                      <Link href={href} className={LINK_CLASS}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav aria-label="Connect">
              <h3 className={HEADING_CLASS}>Connect</h3>
              <ul className="mt-4 space-y-2.5">
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group ${LINK_CLASS}`}
                    >
                      <span>{label}</span>
                      <ArrowUpRight
                        size={13}
                        aria-hidden="true"
                        className="opacity-50 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                      />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Legal & Meta Bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-obsidian-border pt-6 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p>© {currentYear} AlgoGuru. All rights reserved.</p>
            <span aria-hidden="true" className="text-muted-foreground/40">
              ·
            </span>
            <p>Built by Aritra</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              aria-label="Supported engineering tracks"
              className="font-mono text-[11.5px] text-muted-foreground/90"
            >
              {PRODUCT_TRACKS.join(" · ")}
            </p>
            <span
              aria-hidden="true"
              className="hidden h-3.5 w-px bg-obsidian-border sm:inline-block"
            />
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={scrollToTop}
              className={`gap-1.5 text-[12.5px] font-medium ${LINK_CLASS}`}
            >
              <span>Back to top</span>
              <ArrowUp size={13} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
