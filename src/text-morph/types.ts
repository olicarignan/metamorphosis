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
   * Use the "cascade" animation instead of the default morph: a numericText-style
   * vertical roll where entering segments rise up from below and fade in,
   * exiting segments roll up and out, with no scale and a left-to-right stagger.
   * The slide distance scales with the element's font size automatically.
   *
   * `enterSlide` and `stagger` below override the auto-derived values when set.
   */
  cascade?: boolean;
  /**
   * Pixels that entering segments slide up from as they fade in. Overrides the
   * distance `cascade` derives from font size. When set on its own (without
   * `cascade`) it still enables the slide; `0` keeps the default behavior (new
   * segments emerge from their nearest anchor).
   */
  enterSlide?: number;
  /**
   * Milliseconds of delay added per entering segment, staggering entrances
   * left to right. Overrides the `cascade` default; `0` disables the stagger.
   */
  stagger?: number;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
