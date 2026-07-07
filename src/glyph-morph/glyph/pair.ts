import type { NormGlyph, NormContour, Pt } from "../types";

/**
 * Align two glyphs so they can be lerped point-by-point. Both returned glyphs
 * have the same number of contours (the larger of the two counts), each with the
 * same point count, and contour `i` of `from` is matched to contour `i` of `to`:
 *
 *  - contours are paired by shape (signed area sign, then centroid) so outer maps
 *    to outer and holes map to holes;
 *  - the shorter side is padded with **collapsed** contours — every point at the
 *    counterpart's centroid — so an extra hole/counter grows out of a point (the
 *    glyph analog of icon-morph collapsing an unused line to center);
 *  - each `to` contour's point ring is rotated to the start offset that minimizes
 *    travel from the matching `from` contour. Winding is never reversed, so holes
 *    stay wound opposite to outers and keep subtracting under `fill-rule: nonzero`.
 *
 * Pairing is a pure function of the two glyphs and is memoized by the engine.
 */
export function pairGlyphs(
  from: NormGlyph,
  to: NormGlyph,
): { from: NormGlyph; to: NormGlyph } {
  const fromSorted = [...from.contours].sort(compareContours);
  const toSorted = [...to.contours].sort(compareContours);
  const n = Math.max(fromSorted.length, toSorted.length);
  const pointCount = (fromSorted[0] ?? toSorted[0])!.pts.length;

  const outFrom: NormContour[] = [];
  const outTo: NormContour[] = [];

  for (let i = 0; i < n; i++) {
    const fc = fromSorted[i];
    const tc = toSorted[i];

    if (fc && tc) {
      outFrom.push(fc);
      outTo.push(align(fc, tc));
    } else if (fc) {
      // `to` has fewer contours — collapse this one into `to`'s centroid.
      outFrom.push(fc);
      outTo.push(collapsedAt(fc.centroid, pointCount));
    } else {
      // `from` has fewer contours — grow this one out of `from`'s centroid.
      outFrom.push(collapsedAt(tc!.centroid, pointCount));
      outTo.push(tc!);
    }
  }

  return {
    from: { ...from, contours: outFrom },
    to: { ...to, contours: outTo },
  };
}

// Sort key: outer contours vs. holes (by winding sign), then position. Pairing
// by index after this sort keeps like matched with like across the two glyphs.
function compareContours(a: NormContour, b: NormContour): number {
  const sa = Math.sign(signedArea(a.pts));
  const sb = Math.sign(signedArea(b.pts));
  if (sa !== sb) return sb - sa;
  if (a.centroid.y !== b.centroid.y) return a.centroid.y - b.centroid.y;
  return a.centroid.x - b.centroid.x;
}

// Rotate `tc`'s ring to the start offset closest to `fc`. Direction (winding) is
// left untouched so holes stay wound opposite to outers for `fill-rule: nonzero`.
function align(fc: NormContour, tc: NormContour): NormContour {
  const n = tc.pts.length;
  let best = tc.pts;
  let bestCost = Infinity;

  for (let offset = 0; offset < n; offset++) {
    let cost = 0;
    for (let j = 0; j < n; j++) {
      const p = tc.pts[(j + offset) % n]!;
      const q = fc.pts[j]!;
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      cost += dx * dx + dy * dy;
      if (cost >= bestCost) break; // prune: can't win
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = rotate(tc.pts, offset);
    }
  }

  return { ...tc, pts: best };
}

function collapsedAt(centroid: Pt, pointCount: number): NormContour {
  const pts: Pt[] = new Array(pointCount);
  for (let i = 0; i < pointCount; i++) pts[i] = { x: centroid.x, y: centroid.y };
  return { pts, centroid };
}

function signedArea(pts: Pt[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  return area / 2;
}

function rotate(pts: Pt[], offset: number): Pt[] {
  if (offset === 0) return pts.slice();
  const n = pts.length;
  const out: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = pts[(i + offset) % n]!;
  return out;
}
