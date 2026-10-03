/**
 * Deterministic browser-environment helpers for exam tests.
 *
 * jsdom implements neither fullscreen nor `document.hidden`, so both have to be
 * faked. This is the same technique the MCQ suite already uses, extracted so
 * the coding-contest tests share one implementation instead of copying it.
 */

const restoreProperties: Array<() => void> = [];

/** Define a property on a browser global and remember how to put it back. */
export function setBrowserProperty(
  target: object,
  key: string,
  value: unknown,
): void {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, value });
  restoreProperties.push(() => {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  });
}

export function changeFullscreen(element: Element | null): void {
  setBrowserProperty(document, "fullscreenElement", element);
  document.dispatchEvent(new Event("fullscreenchange"));
}

export function enterFullscreen(): void {
  changeFullscreen(document.documentElement);
}

/** Put the document into fullscreen WITHOUT dispatching an event. */
export function setFullscreenSilently(element: Element | null): void {
  setBrowserProperty(document, "fullscreenElement", element);
}

export function setHidden(hidden: boolean): void {
  setBrowserProperty(document, "hidden", hidden);
  document.dispatchEvent(new Event("visibilitychange"));
}

export function loseFocus(): void {
  window.dispatchEvent(new Event("blur"));
}

/** Install the standard fullscreen + focus fakes. Call from `beforeEach`. */
export function installExamBrowserEnv(): void {
  setBrowserProperty(document, "hidden", false);
  setBrowserProperty(document, "fullscreenElement", null);
  setBrowserProperty(
    document.documentElement,
    "requestFullscreen",
    (): Promise<void> => {
      enterFullscreen();
      return Promise.resolve();
    },
  );
  setBrowserProperty(
    document,
    "exitFullscreen",
    (): Promise<void> => {
      changeFullscreen(null);
      return Promise.resolve();
    },
  );
}

/** Undo every property installed by the helpers above. */
export function restoreExamBrowserEnv(): void {
  while (restoreProperties.length) restoreProperties.pop()!();
}
