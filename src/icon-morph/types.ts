import type { SpringParams } from "../shared/spring";

/**
 * A single straight segment as `[x1, y1, x2, y2]` in the shared 24×24 icon box
 * (center is 12,12). A segment whose four values are all 12 is "collapsed": a
 * zero-length point at center, rendered invisible (opacity 0).
 */
export type LineDef = [number, number, number, number];

/**
 * An icon as up to three line segments plus an optional rotation (degrees).
 * Fewer than three lines are padded with collapsed center points, so every
 * resolved icon has exactly three lines and any icon morphs cleanly into any
 * other. Rotational variants (e.g. arrows) share identical `lines` and differ
 * only in `rotation`, so morphing between them rotates instead of moving points.
 */
export interface IconDef {
  lines: LineDef[];
  rotation?: number;
}

export interface IconMorphOptions {
  element: HTMLElement;
  /** Rendered px size of the square icon. Default 24. */
  size?: number;
  /** Stroke width in the 24-unit icon space. Default 2. */
  strokeWidth?: number;
  /** Stroke color. Default "currentColor". */
  color?: string;
  /** Morph duration in ms (ignored when `ease` is a spring). Default 400. */
  duration?: number;
  ease?: string | SpringParams;
  disabled?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}
