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
  /**
   * Peak Gaussian blur applied only while morphing, in em units. It ramps from 0
   * up to this value and back to 0, so the glyph is perfectly crisp at rest.
   * Small values are subtle (e.g. 0.02 ≈ a hair of blur at the shape's most-fluid
   * moment). Set 0 to disable. Default 0.02.
   */
  blur?: number;
  /**
   * Fraction of the morph (0–1) by which the blur has fully risen and fallen
   * back to 0, so the glyph is crisp for the remainder as it settles. Lower =
   * the blur clears earlier. Default 0.5.
   */
  blurEnd?: number;
  /**
   * Shoulder sharpness of the blur envelope. `1` is a plain sine bell; higher
   * values sharpen the rise/fall so the blur lingers less at its edges. Default
   * 2.
   */
  blurCurve?: number;
  ease?: string | SpringParams;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
