import type { IconMorphOptions, IconDef, LineDef } from "./types";
import { ICONS, VIEW, CENTER } from "./icons";
import { spring as resolveSpring, springEasingFn } from "../shared/spring";
import {
  type ReducedMotionState,
  createReducedMotionListener,
} from "../shared/reduced-motion";

const SVG_NS = "http://www.w3.org/2000/svg";

export const DEFAULT_ICON_MORPH_OPTIONS = {
  size: 24,
  strokeWidth: 2,
  color: "currentColor",
  duration: 400,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  disabled: false,
  respectReducedMotion: true,
} as const satisfies Omit<IconMorphOptions, "element">;

type LineState = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
};
type IconState = {
  lines: [LineState, LineState, LineState];
  rotation: number;
};

// A line is "collapsed" (invisible) when both endpoints sit at the center.
function isCollapsed(l: LineDef): boolean {
  return l[0] === CENTER && l[1] === CENTER && l[2] === CENTER && l[3] === CENTER;
}

function resolveState(d: IconDef): IconState {
  const lines = d.lines.map((l) => ({
    x1: l[0],
    y1: l[1],
    x2: l[2],
    y2: l[3],
    opacity: isCollapsed(l) ? 0 : 1,
  })) as [LineState, LineState, LineState];
  return { lines, rotation: d.rotation ?? 0 };
}

function cloneState(s: IconState): IconState {
  return {
    lines: s.lines.map((l) => ({ ...l })) as [
      LineState,
      LineState,
      LineState,
    ],
    rotation: s.rotation,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Smallest signed angular distance from `a` to `b`, in (-180, 180].
function shortestDelta(a: number, b: number): number {
  return (((b - a) % 360) + 540) % 360 - 180;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class IconMorph {
  private element: HTMLElement;
  private options: Omit<IconMorphOptions, "element" | "ease"> & { ease: string };
  private easingFn: (t: number) => number;

  private group!: SVGGElement;
  private lineEls!: SVGLineElement[];

  private currentName: string | null = null;
  private current: IconState | null = null;
  private isInitialRender = true;
  private rafId: number | null = null;
  private reducedMotion: ReducedMotionState | null = null;

  constructor(options: IconMorphOptions) {
    const { ease: rawEase, ...rest } = {
      ...DEFAULT_ICON_MORPH_OPTIONS,
      ...options,
    };

    let ease: string;
    let duration: number;
    if (typeof rawEase === "object") {
      const resolved = resolveSpring(rawEase);
      ease = resolved.easing;
      duration = resolved.duration;
      this.easingFn = springEasingFn(rawEase);
    } else {
      ease = rawEase;
      duration = rest.duration!;
      this.easingFn = easeOutCubic;
    }

    this.options = { ...rest, ease, duration };
    this.element = options.element;

    if (this.options.respectReducedMotion) {
      this.reducedMotion = createReducedMotionListener();
    }

    this.build();
  }

  private build() {
    const { size, strokeWidth, color } = this.options;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${VIEW} ${VIEW}`);
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", color!);
    svg.setAttribute("stroke-width", String(strokeWidth));
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.style.display = "block";

    this.group = document.createElementNS(SVG_NS, "g");
    svg.appendChild(this.group);

    this.lineEls = [0, 1, 2].map(() => {
      const ln = document.createElementNS(SVG_NS, "line");
      this.group.appendChild(ln);
      return ln;
    });

    this.element.replaceChildren(svg);
  }

  destroy() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.reducedMotion?.destroy();
    this.element.replaceChildren();
  }

  private isDisabled(): boolean {
    return Boolean(
      this.options.disabled || this.reducedMotion?.prefersReducedMotion,
    );
  }

  update(name: string, icon?: IconDef) {
    const d = icon ?? ICONS[name];
    if (!d) return; // unknown icon name and no inline def — leave as-is
    if (name === this.currentName && !icon) return;
    this.currentName = name;

    const target = resolveState(d);

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.isInitialRender || this.isDisabled() || !this.current) {
      this.isInitialRender = false;
      this.current = target;
      this.apply(target);
      return;
    }

    this.options.onAnimationStart?.();

    const from = cloneState(this.current);
    const rotDelta = shortestDelta(from.rotation, target.rotation);
    const duration = this.options.duration!;
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const frame = (now: number) => {
      const raw = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      const t = this.easingFn(raw);

      const state: IconState = {
        rotation: from.rotation + rotDelta * t,
        lines: from.lines.map((fl, i) => {
          const tl = target.lines[i]!;
          return {
            x1: lerp(fl.x1, tl.x1, t),
            y1: lerp(fl.y1, tl.y1, t),
            x2: lerp(fl.x2, tl.x2, t),
            y2: lerp(fl.y2, tl.y2, t),
            opacity: lerp(fl.opacity, tl.opacity, t),
          };
        }) as [LineState, LineState, LineState],
      };

      this.current = state;
      this.apply(state);

      if (raw < 1) {
        this.rafId = requestAnimationFrame(frame);
      } else {
        this.rafId = null;
        this.current = target;
        this.apply(target);
        this.options.onAnimationComplete?.();
      }
    };

    this.rafId = requestAnimationFrame(frame);
  }

  private apply(s: IconState) {
    this.group.setAttribute(
      "transform",
      `rotate(${round(s.rotation)} ${CENTER} ${CENTER})`,
    );
    for (let i = 0; i < 3; i++) {
      const el = this.lineEls[i]!;
      const l = s.lines[i]!;
      el.setAttribute("x1", String(round(l.x1)));
      el.setAttribute("y1", String(round(l.y1)));
      el.setAttribute("x2", String(round(l.x2)));
      el.setAttribute("y2", String(round(l.y2)));
      el.setAttribute("opacity", String(round3(l.opacity)));
    }
  }
}

const round = (n: number) => Math.round(n * 100) / 100;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
