import type { IconDef, LineDef } from "./types";

// Shared 24×24 coordinate space; center point used for collapsed lines.
export const VIEW = 24;
export const CENTER = VIEW / 2; // 12

// Every resolved icon is padded to exactly this many line segments, so any icon
// morphs cleanly into any other (extra slots collapse to an invisible center
// point). Bump this only if a new icon needs more strokes — it sets how many
// <line> elements the engine renders per icon.
export const MAX_LINES = 6;

const C = CENTER;
const COLLAPSED: LineDef = [C, C, C, C];

/** Clone up to MAX_LINES lines and pad the rest with collapsed center points. */
function def(lines: LineDef[], rotation = 0): IconDef {
  const out = lines.slice(0, MAX_LINES).map((l) => [...l] as LineDef);
  while (out.length < MAX_LINES) out.push([...COLLAPSED] as LineDef);
  return { lines: out, rotation };
}

// Canonical shapes shared by rotational variants. Variants reuse these exact
// coordinates (by value) and differ only in rotation, so morphing between e.g.
// arrow-up and arrow-right is a pure rotation — no coordinate movement.
const ARROW: LineDef[] = [
  [12, 5, 12, 19], // shaft
  [12, 5, 7, 10], // head (left)
  [12, 5, 17, 10], // head (right)
];
const CHEVRON: LineDef[] = [
  [6, 15, 12, 9],
  [12, 9, 18, 15],
];
// Plus = a horizontal + a vertical line; an X is the same shape rotated 45°.
const CROSS: LineDef[] = [
  [4, 12, 20, 12],
  [12, 4, 12, 20],
];

export const ICONS: Record<string, IconDef> = {
  menu: def([
    [3, 6, 21, 6],
    [3, 12, 21, 12],
    [3, 18, 21, 18],
  ]),
  plus: def(CROSS, 0),
  close: def(CROSS, 45),
  minus: def([[4, 12, 20, 12]]),
  equals: def([
    [4, 9, 20, 9],
    [4, 15, 20, 15],
  ]),
  check: def([
    [5, 13, 10, 18],
    [10, 18, 19, 7],
  ]),
  // Copy / duplicate: a front page (full square) with a back page peeking out
  // top-left as an L. Round linecaps soften the corners into a rounded-rect look.
  copy: def([
    [9, 9, 20, 9], // front: top
    [20, 9, 20, 20], // front: right
    [20, 20, 9, 20], // front: bottom
    [9, 20, 9, 9], // front: left
    [4, 4, 15, 4], // back: top edge peeking out
    [4, 4, 4, 15], // back: left edge peeking out
  ]),
  play: def([
    [8, 5, 8, 19],
    [8, 19, 19, 12],
    [19, 12, 8, 5],
  ]),
  pause: def([
    [9, 5, 9, 19],
    [15, 5, 15, 19],
  ]),
  "arrow-up": def(ARROW, 0),
  "arrow-right": def(ARROW, 90),
  "arrow-down": def(ARROW, 180),
  "arrow-left": def(ARROW, 270),
  "chevron-up": def(CHEVRON, 0),
  "chevron-right": def(CHEVRON, 90),
  "chevron-down": def(CHEVRON, 180),
  "chevron-left": def(CHEVRON, 270),
};

/** Register or override a built-in icon at runtime. */
export function registerIcon(name: string, icon: IconDef): void {
  ICONS[name] = def(icon.lines, icon.rotation ?? 0);
}

/** Names of all currently registered icons. */
export function iconNames(): string[] {
  return Object.keys(ICONS);
}
