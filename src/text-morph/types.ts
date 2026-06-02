import type { SpringParams } from "./utils/spring";

/**
 * How text is broken into animating segments.
 * - `auto`: words when the text contains a space, otherwise graphemes (default)
 * - `word`: always animate whole words
 * - `grapheme`: always animate individual characters (per-letter morphing)
 */
export type Granularity = "auto" | "word" | "grapheme";

export interface TextMorphOptions {
  debug?: boolean;
  element: HTMLElement;
  locale?: Intl.LocalesArgument;
  scale?: boolean;
  duration?: number; // in ms
  ease?: string | SpringParams;
  granularity?: Granularity;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
