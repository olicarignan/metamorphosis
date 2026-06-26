import {
  MORPH_BLUR,
  fadeDuration,
  parseTranslate,
  transitionContainerSize,
} from "../../shared/animate-shared";

export { parseTranslate, transitionContainerSize };

function cancelAnimations(element: HTMLElement): {
  tx: number;
  ty: number;
  opacity: number;
} {
  const { tx, ty } = parseTranslate(element);
  const opacity = Number(getComputedStyle(element).opacity) || 1;
  element.getAnimations().forEach((a) => a.cancel());
  return { tx, ty, opacity };
}

export function animateExit(
  child: HTMLElement,
  options: {
    dx: number;
    dy: number;
    duration: number;
    ease: string;
    scale: boolean;
    slideUp?: number;
  },
) {
  const { dx, dy, duration, ease, scale } = options;
  const slideUp = options.slideUp ?? 0;

  // In slide mode an exiting glyph rolls straight up and out of its slot
  // (the counterpart to entering glyphs rising in from below), with no scale —
  // mirroring SwiftUI's numericText odometer roll. Otherwise it drifts toward
  // its nearest anchor as before.
  const transformTo =
    slideUp > 0
      ? `translate(0px, ${-slideUp}px)`
      : scale
        ? `translate(${dx}px, ${dy}px) scale(0.95)`
        : `translate(${dx}px, ${dy}px)`;

  child.animate(
    {
      transform: transformTo,
      offset: 1,
    },
    {
      duration,
      easing: ease,
      fill: "both",
    },
  );

  const fadeAnimation = child.animate(
    {
      opacity: 0,
      filter: `blur(${MORPH_BLUR}px)`,
      offset: 1,
    },
    {
      duration: fadeDuration(duration, 0.25),
      easing: "linear",
      fill: "both",
    },
  );

  fadeAnimation.onfinish = () => child.remove();
}

export function animateEnterOrPersist(
  child: HTMLElement,
  options: {
    deltaX: number;
    deltaY: number;
    isNew: boolean;
    duration: number;
    ease: string;
    slideUp?: number;
    delay?: number;
  },
) {
  const { deltaX, deltaY, isNew, duration, ease } = options;
  const slideUp = options.slideUp ?? 0;
  const delay = options.delay ?? 0;

  const prev = cancelAnimations(child);

  // When sliding is enabled, entering segments start a fixed distance below
  // their final spot and slide straight up — rather than emerging from the
  // nearest anchor's position. Persisting segments always translate from their
  // previous position.
  const slide = isNew && slideUp > 0;
  const startX = slide ? prev.tx : deltaX + prev.tx;
  const startY = slide ? slideUp + prev.ty : deltaY + prev.ty;
  const startOpacity = isNew && prev.opacity >= 1 ? 0 : prev.opacity;

  // Slide-entering glyphs don't scale — they only translate up and fade, like
  // numericText. Non-sliding new glyphs keep the subtle scale-from-0.95 pop.
  const enterScale = isNew && !slide ? 0.95 : 1;

  child.animate(
    [
      {
        transform: `translate(${startX}px, ${startY}px) scale(${enterScale})`,
      },
      { transform: "none" },
    ],
    {
      duration,
      delay,
      easing: ease,
      fill: "both",
    },
  );

  if (startOpacity < 1) {
    child.animate(
      [
        { opacity: startOpacity, filter: `blur(${MORPH_BLUR}px)` },
        { opacity: 1, filter: "blur(0px)" },
      ],
      {
        duration: fadeDuration(duration, isNew ? 0.5 : 0.25),
        // Sliding entrances fade in immediately so the upward motion from
        // below is visible; non-sliding entrances keep the short delay that
        // lets them settle near their anchor before fading in.
        delay: delay + (isNew && !slide ? fadeDuration(duration, 0.25) : 0),
        easing: "linear",
        fill: "both",
      },
    );
  }
}

