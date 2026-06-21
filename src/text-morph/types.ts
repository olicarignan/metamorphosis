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
  /**
   * Pixels that entering segments slide up from as they fade in. `0` keeps the
   * default behavior (new segments emerge from their nearest anchor).
   */
  enterSlide?: number;
  /**
   * Milliseconds of delay added per entering segment, staggering entrances
   * left to right. `0` disables the stagger (all new segments enter at once).
   */
  stagger?: number;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
