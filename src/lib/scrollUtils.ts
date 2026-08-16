/**
 * Scroll helpers aware of the AlgoGuru app shell.
 * Pages render inside <main class="overflow-y-auto"> (AppLayout), so the
 * window never scrolls — all scroll math must target that container.
 */

export function getNearestScrollableAncestor(el: Element | null): HTMLElement | null {
  let node = el as HTMLElement | null;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Scrolls the app's content container (or window as fallback) to the top. */
export function scrollPageToTop(from: Element | null, behavior: ScrollBehavior = "auto"): void {
  const container = getNearestScrollableAncestor(from);
  if (container) {
    container.scrollTo({ top: 0, behavior });
  } else {
    window.scrollTo({ top: 0, behavior });
  }
}

/**
 * Smooth-scrolls a section into view inside the app scroll container.
 * Falls back to window scrolling when no container exists.
 */
export function scrollPageToElement(el: Element, offsetPx = 96): void {
  const container = getNearestScrollableAncestor(el);
  if (container) {
    const top =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - offsetPx;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offsetPx, behavior: "smooth" });
  }
}
