import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://www.aritrodutta.tech/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

const PRODUCT_LINKS = [
  { label: "Practice", to: "/practice" },
  { label: "Playground", to: "/playground" },
  { label: "Interview", to: "/interview" },
  { label: "Contest", to: "/contest" },
];

const RESOURCE_LINKS = [
  { label: "Roadmap", to: "/roadmap" },
  { label: "Notes", to: "/notes" },
];

const SOCIAL_LINKS = [
  { label: "GitHub", href: GITHUB_URL },
  { label: "LinkedIn", href: LINKEDIN_URL },
  { label: "Twitter (X)", href: TWITTER_URL },
  { label: "Portfolio", href: PORTFOLIO_URL },
];

const LINK_CLASS =
  "inline-flex items-center gap-1 rounded-sm text-[13.5px] text-muted-foreground transition-colors duration-150 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

const HEADING_CLASS = "text-[13px] font-medium text-foreground";

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

  return (
    <footer className="w-full border-t border-obsidian-border bg-obsidian-void">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="AlgoGuru home"
            >
              <AlgoGuruMark size={24} />
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                AlgoGuru
              </span>
            </Link>
            <p className="mt-4 text-[13.5px] leading-6 text-muted-foreground">
              A focused workspace for learning data structures, system design and
              the interviews that move your career forward.
            </p>
            <button
              type="button"
              onClick={onSupportClick}
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-obsidian-border px-3 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-foreground/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Heart size={14} className="text-muted-foreground" aria-hidden="true" />
              Buy me a coffee
            </button>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <h3 className={HEADING_CLASS}>Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={LINK_CLASS}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className={HEADING_CLASS}>Resources</h3>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={LINK_CLASS}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={scrollToTop} className={LINK_CLASS}>
                  Back to top
                </button>
              </li>
            </ul>
          </nav>

          {/* Connect */}
          <nav aria-label="Connect">
            <h3 className={HEADING_CLASS}>Connect</h3>
            <ul className="mt-4 space-y-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group ${LINK_CLASS}`}
                  >
                    {label}
                    <ArrowUpRight
                      size={13}
                      aria-hidden="true"
                      className="opacity-50 transition-opacity duration-150 group-hover:opacity-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-obsidian-border pt-6 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} AlgoGuru. All rights reserved.</p>
          <p>Built by Aritra</p>
        </div>
      </div>
    </footer>
  );
}
