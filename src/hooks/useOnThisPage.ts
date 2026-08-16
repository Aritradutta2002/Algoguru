import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { getNearestScrollableAncestor } from "@/lib/scrollUtils";

export interface TocSection {
  id: string;
  label: string;
}

interface UseOnThisPageOptions {
  /** List of sections in render order. Only sections that exist should be included. */
  sections: TocSection[];
  /** Optional explicit scroll container; defaults to the app's main scroll area. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

/**
 * Tracks which on-page section is currently visible using IntersectionObserver
 * inside the app's scroll container (the window never scrolls in AlgoGuru).
 * Returns the active section id.
 */
export function useOnThisPage({ sections, scrollContainerRef }: UseOnThisPageOptions): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const firstEl = document.getElementById(sectionIds[0]);
    const root = scrollContainerRef?.current ?? getNearestScrollableAncestor(firstEl);

    const visibleSections = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visibleSections) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        setActiveId(bestId);
      },
      {
        root,
        rootMargin: "-80px 0px -65% 0px",
        threshold: [0, 0.15, 0.5, 1],
      }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds, scrollContainerRef]);

  return activeId;
}

/**
 * Scrolls a section into view inside the app's scroll container.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const container = getNearestScrollableAncestor(el);
  if (container) {
    const top =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 80;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }
}

/**
 * Progress 0..1 of how far the reader has scrolled through the current
 * article, measured inside the app's scroll container.
 */
export function useReadingProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let scrollEl: HTMLElement | null = null;
    let raf = 0;
    let disposed = false;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (disposed) return;
        if (scrollEl) {
          const total = scrollEl.scrollHeight - scrollEl.clientHeight;
          setProgress(total <= 0 ? 0 : Math.min(1, Math.max(0, scrollEl.scrollTop / total)));
        } else {
          const doc = document.documentElement;
          const total = doc.scrollHeight - doc.clientHeight;
          setProgress(total <= 0 ? 0 : Math.min(1, Math.max(0, doc.scrollTop / total)));
        }
      });
    };

    const attach = () => {
      if (disposed) return;
      scrollEl = getNearestScrollableAncestor(document.querySelector(".cjd-page"));
      if (scrollEl) {
        scrollEl.addEventListener("scroll", onScroll, { passive: true });
      } else {
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      onScroll();
    };

    // The page node may not be in the DOM yet on first effect run.
    attach();
    if (!scrollEl) {
      const rafId = requestAnimationFrame(attach);
      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(raf);
        scrollEl?.removeEventListener("scroll", onScroll);
        window.removeEventListener("scroll", onScroll);
      };
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      scrollEl?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return progress;
}

/**
 * Debounced persistence of the active reading section.
 * persist should write to the database (per-user) — no localStorage.
 */
export function useReadingPositionPersist(
  activeSection: string | null,
  persist: (sectionId: string) => void
): void {
  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    if (!activeSection) return;
    const timer = setTimeout(() => persistRef.current(activeSection), 1500);
    return () => clearTimeout(timer);
  }, [activeSection]);
}
