import type { Pt } from "../types";

const round = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Build an SVG path `d` string for one resampled contour: a polygon through all
 * its points, closed with `Z`. Coordinates are in em units (rounded for
 * compact attribute strings).
 */
export function contourToD(pts: Pt[]): string {
  if (!pts.length) return "";
  let d = `M${round(pts[0]!.x)} ${round(pts[0]!.y)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${round(pts[i]!.x)} ${round(pts[i]!.y)}`;
  }
  return d + "Z";
}
