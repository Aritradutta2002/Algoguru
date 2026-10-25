import { Link } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Code2,
  Github,
  Globe,
  GraduationCap,
  Heart,
  Linkedin,
  Map as MapIcon,
  Target,
  Trophy,
  Twitter,
} from "lucide-react";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

interface FooterProps {
  onSupportClick: () => void;
}

const PORTFOLIO_URL = "https://www.aritrodutta.tech/";
const GITHUB_URL = "https://github.com/Aritradutta2002";
const LINKEDIN_URL = "https://www.linkedin.com/in/aritra-dutta-rick20/";
const TWITTER_URL = "https://x.com/Aritra1Sept";

const PRODUCT_LINKS = [
  { label: "Practice", to: "/practice", icon: Target },
  { label: "Playground", to: "/playground", icon: Code2 },
  { label: "Interview", to: "/interview", icon: GraduationCap },
  { label: "Contest", to: "/contest", icon: Trophy },
];

const RESOURCE_LINKS = [
  { label: "Roadmap", to: "/roadmap", icon: MapIcon },
  { label: "Notes", to: "/notes", icon: BookOpen },
];

const SOCIAL_LINKS = [
  { label: "GitHub", href: GITHUB_URL, icon: Github },
  { label: "LinkedIn", href: LINKEDIN_URL, icon: Linkedin },
  { label: "Twitter (X)", href: TWITTER_URL, icon: Twitter },
  { label: "Portfolio", href: PORTFOLIO_URL, icon: Globe },
];

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
    <footer className="relative mt-20 w-full overflow-hidden border-t border-border/70 bg-[linear-gradient(180deg,transparent,hsl(var(--muted)/0.28))]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.4),rgb(103_232_249/0.2),transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_75%_at_50%_0%,hsl(var(--primary)/0.055),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16 lg:px-16">
        <div className="grid gap-10 md:grid-cols-[1.25fr_1fr_1fr_1.1fr] md:gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="AlgoGuru home"
            >
              <AlgoGuruMark size={34} />
              <span className="font-display text-[16px] font-bold tracking-tight">
                Algo<span className="text-primary">Guru</span>
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-6 text-muted-foreground">
              A focused workspace for mastering data structures, system design,
              and the interviews that move your career forward.
            </p>
            <button
              type="button"
              onClick={onSupportClick}
              className="group mt-5 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3.5 py-2 text-[12px] font-semibold text-muted-foreground shadow-soft transition-all duration-200 hover:border-primary/30 hover:bg-card hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Heart size={13} className="text-rose-500 transition-transform duration-200 group-hover:scale-110" />
              Buy me a coffee
            </button>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Product
            </h3>
            <div className="mt-4 flex flex-col gap-1">
              {PRODUCT_LINKS.map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-2 rounded-md py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon
                    size={13}
                    className="text-muted-foreground/60 transition-colors group-hover:text-primary"
                  />
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Resources
            </h3>
            <div className="mt-4 flex flex-col gap-1">
              {RESOURCE_LINKS.map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-2 rounded-md py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon
                    size={13}
                    className="text-muted-foreground/60 transition-colors group-hover:text-primary"
                  />
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={scrollToTop}
                className="group flex items-center gap-2 rounded-md py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowUp
                  size={13}
                  className="text-muted-foreground/60 transition-colors group-hover:text-primary"
                />
                Back to top
              </button>
            </div>
          </nav>

          {/* Connect */}
          <nav aria-label="Connect">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Connect
            </h3>
            <div className="mt-4 flex flex-col gap-1">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 rounded-md py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      size={13}
                      className="text-muted-foreground/60 transition-colors group-hover:text-primary"
                    />
                    {label}
                  </span>
                  <ArrowUpRight
                    size={12}
                    className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-60"
                  />
                </a>
              ))}
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-5 text-[11.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} AlgoGuru. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span>Built by Aritra</span>
            <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
            <span className="font-medium text-foreground/70">
              Master code. Ace interviews.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
