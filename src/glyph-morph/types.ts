import type { SpringParams } from "../shared/spring";

/** A 2D point in the normalized em coordinate space (see {@link NormGlyph}). */
export type Pt = { x: number; y: number };

/**
 * One closed contour of a glyph outline, resampled to a fixed number of equally
 * spaced points so any two contours can be linearly interpolated point-by-point.
 * A "collapsed" contour (padded in to match a paired glyph with more contours)
 * has every point at `centroid`, so it grows out of / shrinks into a single
 * point — the glyph analog of icon-morph collapsing an unused line to the center.
 * Winding is preserved from the font so holes subtract under `fill-rule: nonzero`.
 */
export type NormContour = {
  pts: Pt[];
  centroid: Pt;
};

/**
 * A glyph outline normalized into the em box: y is flipped to SVG space
 * (y-down) and every coordinate is divided by the font's `unitsPerEm`, so `1`
 * unit == `1em`. `ascent`/`descent` (also in em) drive the viewBox and baseline
 * alignment; `advance` (em) is the glyph's horizontal advance width.
 */
export type NormGlyph = {
  contours: NormContour[];
  advance: number;
  ascent: number;
  descent: number;
};

export interface GlyphMorphOptions {
  element: HTMLElement;
  /** Font to read outlines from: a URL to a .ttf/.otf/.woff, or preloaded bytes. */
  font: string | ArrayBuffer;
  /** Fill color of the glyph. Default "currentColor" (inherits text color). */
  color?: string;
  /** Morph duration in ms (ignored when `ease` is a spring). Default 400. */
  duration?: number;
  ease?: string | SpringParams;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
