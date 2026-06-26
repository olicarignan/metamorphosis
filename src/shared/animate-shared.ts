export const MAX_FADE_DURATION = 150;
export const MORPH_BLUR = 1; // px of blur applied as elements fade in/out

export function fadeDuration(duration: number, fraction: number): number {
  return Math.min(duration * fraction, MAX_FADE_DURATION);
}

export function parseTranslate(element: HTMLElement): {
  tx: number;
  ty: number;
} {
  const transform = getComputedStyle(element).transform;
  if (!transform || transform === "none") return { tx: 0, ty: 0 };
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return { tx: 0, ty: 0 };
  const v = match[1]!.split(",").map(Number);
  return { tx: v[4] || 0, ty: v[5] || 0 };
}

let pendingCleanup: (() => void) | null = null;

/**
 * Eases an inline-block container's width/height from its previous size to the
 * size demanded by its new content, via a CSS transition. The element must
 * already declare `transition-property: width, height` and a duration/easing
 * (the morph engines set these on the root). Shared by text and icon morphs.
 */
export function transitionContainerSize(
  element: HTMLElement,
  oldWidth: number,
  oldHeight: number,
  duration: number,
  onComplete?: () => void,
) {
  // Cancel any pending cleanup from a previous transition
  if (pendingCleanup) {
    pendingCleanup();
    pendingCleanup = null;
  }

  if (oldWidth === 0 || oldHeight === 0) return;

  element.style.width = "auto";
  element.style.height = "auto";
  void element.offsetWidth;

  const newRect = element.getBoundingClientRect();
  const newWidth = newRect.width;
  const newHeight = newRect.height;

  element.style.width = `${oldWidth}px`;
  element.style.height = `${oldHeight}px`;
  void element.offsetWidth;

  element.style.width = `${newWidth}px`;
  element.style.height = `${newHeight}px`;

  function cleanup() {
    element.removeEventListener("transitionend", onEnd);
    clearTimeout(fallbackTimer);
    pendingCleanup = null;
    element.style.width = "auto";
    element.style.height = "auto";
    onComplete?.();
  }

  function onEnd(e: TransitionEvent) {
    if (e.target !== element) return;
    if (e.propertyName !== "width" && e.propertyName !== "height") return;
    cleanup();
  }

  element.addEventListener("transitionend", onEnd);
  const fallbackTimer = setTimeout(cleanup, duration + 50);
  pendingCleanup = () => {
    element.removeEventListener("transitionend", onEnd);
    clearTimeout(fallbackTimer);
    pendingCleanup = null;
  };
}
