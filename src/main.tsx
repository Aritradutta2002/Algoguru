import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Fade the static pre-hydration splash out once React takes over. It lives as a
 * sibling of #root (not a child) so React never has to reconcile it, and it is
 * removed on the next tick after App's first commit instead of blocking paint.
 */
function dismissBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;

  splash.setAttribute("data-state", "leaving");

  const remove = () => splash.remove();
  splash.addEventListener("transitionend", remove, { once: true });
  // Belt and braces: some browsers skip transitionend when the tab is hidden.
  window.setTimeout(remove, 400);
}

createRoot(document.getElementById("root")!).render(<App />);

window.requestAnimationFrame(() => window.requestAnimationFrame(dismissBootSplash));
