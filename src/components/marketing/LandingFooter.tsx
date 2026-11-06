import { Link } from "react-router-dom";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

/**
 * Compact site footer. Every link resolves to a route that exists in the
 * application (the app routes redirect signed-out visitors to /auth, which is
 * the intended gate). No invented social accounts, no dead legal pages.
 */

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "Practice problems", to: "/practice" },
      { label: "Playground", to: "/playground" },
      { label: "Roadmaps", to: "/roadmap" },
      { label: "Interview prep", to: "/interview" },
    ],
  },
  {
    title: "Tracks",
    links: [
      { label: "Arrays & patterns", to: "/arrays" },
      { label: "Core Java Q&A", to: "/interview/java/core-java-qa" },
      { label: "Spring Boot", to: "/interview/java/spring-boot" },
      { label: "System design", to: "/interview/java/system-design" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "Create an account", to: "/auth?mode=signup" },
      { label: "Notes", to: "/notes" },
      { label: "Profile", to: "/profile" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-[hsl(var(--surface-chrome))]">
      <div className="mx-auto w-full max-w-content px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="AlgoGuru home"
            >
              <AlgoGuruMark size={26} />
              <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                Algo<span className="text-primary">Guru</span>
              </span>
            </Link>
            <p className="mt-3 max-w-[34ch] text-[12.5px] leading-6 text-muted-foreground">
              A study workspace for data structures, algorithms and the
              interviews that follow. Free to use, no credit card.
            </p>
            <Link
              to="/buy-me-a-coffee"
              className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-[12px] font-medium text-muted-foreground underline-offset-4 transition-colors duration-1 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Support the project
            </Link>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-flex rounded-xs text-[12.5px] text-muted-foreground transition-colors duration-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[10.5px] text-muted-foreground">
            © {new Date().getFullYear()} AlgoGuru
          </p>
          <p className="font-mono text-[10.5px] text-muted-foreground/70">
            Built for engineers who want depth, not a highlight reel.
          </p>
        </div>
      </div>
    </footer>
  );
}
