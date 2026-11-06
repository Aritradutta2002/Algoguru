import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { AlgoGuruMark } from "@/components/brand/AlgoGuruMark";

/**
 * Public site navigation.
 *
 * Adapted from Vengeance UI's Spotlight Navbar
 * (https://www.vengenceui.com/components/spotlight-navbar). The published
 * component is a decorative pointer-following pill; this version keeps the
 * spotlight idea but:
 *   • navigates real in-page sections and tracks the active one with
 *     IntersectionObserver, so the indicator tells the truth;
 *   • uses <a> elements with visible focus rings instead of click-only divs;
 *   • drops the mouse spotlight entirely for touch and reduced-motion users;
 *   • compacts (shorter, blurred, hairline only) once the page scrolls.
 */

// Ordered exactly as they appear on the page; the numbers mirror the section
// indices used in the copy so the indicator can never disagree with the layout.
const SECTIONS = [
  { id: "session", label: "A session", index: "01" },
  { id: "workspace", label: "Workspace", index: "02" },
  { id: "path", label: "The path", index: "03" },
  { id: "numbers", label: "By the numbers", index: "04" },
] as const;

export function LandingNav() {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const progressRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Scroll state + reading progress in one passive listener, written straight to
  // a CSS variable so the header never re-renders while the page moves.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio =
          max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        progressRef.current?.style.setProperty("--progress", String(ratio));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const targets = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => Boolean(node));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.6] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  // Pointer spotlight writes straight to a CSS variable — no React state per
  // mouse move, so the nav never re-renders while the cursor travels.
  useEffect(() => {
    const nav = navRef.current;
    const spotlight = spotlightRef.current;
    if (!nav || !spotlight) return;
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = nav.getBoundingClientRect();
      const x = event.clientX - rect.left;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        spotlight.style.setProperty("--spot-x", `${x}px`);
        spotlight.style.opacity = "1";
      });
    };
    const onLeave = () => {
      spotlight.style.opacity = "0";
    };

    nav.addEventListener("pointermove", onMove);
    nav.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      nav.removeEventListener("pointermove", onMove);
      nav.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion]);

  const goTo = (id: string) => {
    setMenuOpen(false);
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
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-nav transition-[background-color,border-color,backdrop-filter] duration-2",
        scrolled
          ? "border-b border-line bg-[hsl(var(--surface-page)/0.82)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      {/* reading progress — a single hairline, transform only */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary/70"
        style={{ transform: "scaleX(var(--progress, 0))" }}
      />

      <div
        className={cn(
          "mx-auto flex w-full max-w-content items-center justify-between gap-4 px-5 transition-[height] duration-2 sm:px-8",
          scrolled ? "h-12" : "h-16",
        )}
      >
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="AlgoGuru home"
        >
          <AlgoGuruMark size={26} />
          <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">
            Algo<span className="text-primary">Guru</span>
          </span>
        </Link>

        <nav
          ref={navRef}
          aria-label="Sections"
          className="relative hidden lg:block"
        >
          <div
            ref={spotlightRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-10 opacity-0 transition-opacity duration-3"
            style={{
              background:
                "radial-gradient(140px circle at var(--spot-x, 50%) 100%, hsl(var(--primary) / 0.22), transparent 72%)",
            }}
          />
          <ul className="flex items-center gap-1">
            {SECTIONS.map((section) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id} className="relative">
                  <a
                    href={`#${section.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(section.id);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative flex h-8 items-center gap-1.5 rounded-sm px-3 text-[13px] font-medium transition-colors duration-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "font-mono text-[9px] tabular-nums transition-colors duration-1",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {section.index}
                    </span>
                    {section.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-mark"
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 320, damping: 32 }
                        }
                        className="absolute inset-x-2.5 -bottom-px h-px bg-primary"
                        aria-hidden="true"
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden h-9 items-center rounded-sm px-3 text-[13px] font-medium text-muted-foreground transition-colors duration-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="group inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-[background-color,transform] duration-1 hover:bg-primary/90 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-page))]"
          >
            Start free
            <ArrowRight
              size={14}
              className="transition-transform duration-2 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-[86vw] max-w-xs border-l border-line bg-[hsl(var(--surface-panel))] p-0"
        >
          <SheetTitle className="border-b border-line px-5 py-4 text-left text-sm font-semibold">
            Sections
          </SheetTitle>
          <SheetDescription className="sr-only">
            Jump to a section of the AlgoGuru landing page.
          </SheetDescription>
          <nav aria-label="Sections" className="px-3 py-3">
            <ul className="space-y-0.5">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => goTo(section.id)}
                    className="flex h-11 w-full items-center rounded-sm px-2.5 text-left text-sm font-medium text-muted-foreground transition-colors duration-1 hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-2 border-t border-line px-5 py-4">
            <Link
              to="/auth"
              className="flex h-11 items-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in to your workspace
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
