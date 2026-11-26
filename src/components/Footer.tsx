"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight, Heart, Search } from "lucide-react";
import { SurfaceLockup } from "@/components/brand/SurfaceLockup";
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
      role="contentinfo"
      aria-label="Site footer"
      className="ag-theme ag-footer"
    >
      <div className="ag-footer__inner">
        <div className="ag-footer__body">
          <div>
            <Link
              href="/"
              aria-label="AlgoGuru home"
              className="ag-header__mark"
            >
              <SurfaceLockup />
            </Link>

            <p className="ag-footer__summary">
              A structured engineering workspace for data structures, Java internals,
              system design, and timed coding interviews.
            </p>

            <div className="ag-footer__actions">
              <Button
                variant="bare"
                size="bare"
                type="button"
                onClick={openCommandPalette}
                aria-label="Quick search (Cmd or Ctrl + K)"
                className="ag-footer__link"
              >
                <Search size={12} aria-hidden="true" className="shrink-0 !size-3" />
                <span>Quick search</span>
                <kbd>⌘K</kbd>
              </Button>
              <Button
                type="button"
                variant="bare"
                size="bare"
                onClick={onSupportClick}
                className="ag-footer__link"
              >
                <Heart
                  size={13}
                  aria-hidden="true"
                />
                Buy me a coffee
              </Button>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="ag-footer__groups">
            {FOOTER_NAV_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.ariaLabel}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map(({ label, href }) => (
                    <li key={href}>
                      <Link href={href} className="ag-footer__link">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav aria-label="Connect">
              <h3>Connect</h3>
              <ul>
                {SOCIAL_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ag-footer__link"
                    >
                      <span>{label}</span>
                      <ArrowUpRight
                        size={13}
                        aria-hidden="true"
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
        <div className="ag-footer__meta">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p>© {currentYear} AlgoGuru. All rights reserved.</p>
            <span aria-hidden="true">
              ·
            </span>
            <p>Built by Aritra</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p
              aria-label="Supported engineering tracks"
            >
              {PRODUCT_TRACKS.join(" · ")}
            </p>
            <span
              aria-hidden="true"
              className="hidden h-3.5 w-px bg-current opacity-30 sm:inline-block"
            />
            <Button
              variant="bare"
              size="bare"
              type="button"
              onClick={scrollToTop}
              className="ag-footer__link"
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
