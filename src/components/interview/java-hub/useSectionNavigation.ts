/**
 * Section-anchor navigation helpers for the Java Interview Hub.
 *
 * The hub uses real `#section` anchors (crawlable, keyboard-friendly); smooth
 * scrolling is a progressive enhancement layered on top and is disabled when the
 * visitor asks for reduced motion. Active-section tracking reuses the
 * IntersectionObserver approach already proven on this page.
 */
import { useEffect, useState, type MouseEvent } from "react";

export interface SectionLink {
  id: string;
  label: string;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function handleSectionLinkClick(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  if (typeof window !== "undefined" && window.history) {
    window.history.replaceState(null, "", `#${id}`);
  }
}

export function useActiveSection(sections: readonly SectionLink[]): string {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 }
    );
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return active;
}
