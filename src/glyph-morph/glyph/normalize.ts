import type { Font } from "fontkit";
import type { NormGlyph, NormContour, Pt } from "../types";
import { getRawGlyph } from "../font/resolve";

// Points every contour is resampled to. Higher = smoother (esp. at display
// sizes) but more work per frame and in pairing; 128 stays crisp well past 1em.
export const POINTS_PER_CONTOUR = 128;
// Line segments each Bézier curve is flattened into before resampling.
const CURVE_STEPS = 16;

// One normalized glyph per (font, char), memoized. Normalization (flatten +
// resample) is pure given the font, so this never needs invalidation.
const cache = new WeakMap<Font, Map<string, NormGlyph | null>>();

/**
 * Read `char` from `font` and normalize it into the em box (see {@link NormGlyph}).
 * Returns `null` for unsupported / contourless glyphs (caller falls back to text).
 */
export function normalizeGlyph(font: Font, char: string): NormGlyph | null {
  let perFont = cache.get(font);
  if (!perFont) {
    perFont = new Map();
    cache.set(font, perFont);
  }
  if (perFont.has(char)) return perFont.get(char)!;

  const glyph = build(font, char);
  perFont.set(char, glyph);
  return glyph;
}

function build(font: Font, char: string): NormGlyph | null {
  const raw = getRawGlyph(font, char);
  if (!raw) return null;

  const { commands, advanceWidth, unitsPerEm, ascender, descender } = raw;
  const ascent = ascender / unitsPerEm;
  const descent = -descender / unitsPerEm; // descender is negative (below baseline)

  // Map a font-unit point (y-up, baseline at 0) into the em box (y-down, top at
  // 0): x scales by 1/unitsPerEm; the baseline lands at y = ascent.
  const tx = (x: number) => x / unitsPerEm;
  const ty = (y: number) => ascent - y / unitsPerEm;

  // Walk the path commands into flattened, closed contours (polylines in em space).
  const rawContours: Pt[][] = [];
  let current: Pt[] = [];
  let cx = 0;
  let cy = 0; // current pen position, in em space

  const moveTo = (x: number, y: number) => {
    if (current.length) rawContours.push(current);
    current = [{ x, y }];
    cx = x;
    cy = y;
  };
  const lineTo = (x: number, y: number) => {
    current.push({ x, y });
    cx = x;
    cy = y;
  };

  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        moveTo(tx(cmd.x), ty(cmd.y));
        break;
      case "L":
        lineTo(tx(cmd.x), ty(cmd.y));
        break;
      case "Q": {
        const x1 = tx(cmd.x1);
        const y1 = ty(cmd.y1);
        const ex = tx(cmd.x);
        const ey = ty(cmd.y);
        // Save the start point: lineTo mutates cx/cy each step, so the Bézier
        // must interpolate from the fixed start, not the last plotted point.
        const sx = cx;
        const sy = cy;
        for (let i = 1; i <= CURVE_STEPS; i++) {
          const t = i / CURVE_STEPS;
          const u = 1 - t;
          lineTo(
            u * u * sx + 2 * u * t * x1 + t * t * ex,
            u * u * sy + 2 * u * t * y1 + t * t * ey,
          );
        }
        break;
      }
      case "C": {
        const x1 = tx(cmd.x1);
        const y1 = ty(cmd.y1);
        const x2 = tx(cmd.x2);
        const y2 = ty(cmd.y2);
        const ex = tx(cmd.x);
        const ey = ty(cmd.y);
        const sx = cx;
        const sy = cy;
        for (let i = 1; i <= CURVE_STEPS; i++) {
          const t = i / CURVE_STEPS;
          const u = 1 - t;
          lineTo(
            u * u * u * sx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
            u * u * u * sy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
          );
        }
        break;
      }
      case "Z":
        if (current.length) rawContours.push(current);
        current = [];
        break;
    }
  }
  if (current.length) rawContours.push(current);

  const contours: NormContour[] = [];
  for (const poly of rawContours) {
    const pts = resampleClosed(poly, POINTS_PER_CONTOUR);
    if (pts) contours.push({ pts, centroid: centroidOf(pts) });
  }
  if (!contours.length) return null;

  return { contours, advance: advanceWidth / unitsPerEm, ascent, descent };
}

/**
 * Resample a closed polyline to exactly `n` points spaced equally along its
 * perimeter (the closing segment from last back to first is included). Returns
 * `null` for a degenerate (zero-length) contour.
 */
function resampleClosed(poly: Pt[], n: number): Pt[] | null {
  const count = poly.length;
  // Cumulative arc length at each vertex, plus the wrap back to the start.
  const seg: number[] = new Array(count);
  let perimeter = 0;
  for (let i = 0; i < count; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % count]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    seg[i] = len;
    perimeter += len;
  }
  if (perimeter === 0) return null;

  const out: Pt[] = new Array(n);
  const step = perimeter / n;
  let si = 0; // current segment index
  let acc = 0; // arc length at the start of segment si
  for (let i = 0; i < n; i++) {
    const target = i * step;
    while (si < count - 1 && acc + seg[si]! < target) {
      acc += seg[si]!;
      si++;
    }
    const a = poly[si]!;
    const b = poly[(si + 1) % count]!;
    const segLen = seg[si]!;
    const t = segLen > 0 ? (target - acc) / segLen : 0;
    out[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  return out;
}

function centroidOf(pts: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}
