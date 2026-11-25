type EscapeKeyHandler = (event: KeyboardEvent) => boolean;

interface EscapeKeyLayer {
  handler: EscapeKeyHandler;
  priority: number;
}

// Ascending priority keeps the newest highest-priority layer at the end.
const layers: EscapeKeyLayer[] = [];

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;

  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (layers[index].handler(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  }
}

/** Register an Escape layer; higher priorities are closer to the user. */
export function registerEscapeKeyHandler(
  handler: EscapeKeyHandler,
  priority = 0,
) {
  const layer = { handler, priority };
  layers.push(layer);
  layers.sort((a, b) => a.priority - b.priority);

  if (layers.length === 1) {
    window.addEventListener("keydown", handleKeyDown);
  }

  return () => {
    const index = layers.indexOf(layer);
    if (index === -1) return;

    layers.splice(index, 1);
    if (layers.length === 0) {
      window.removeEventListener("keydown", handleKeyDown);
    }
  };
}
