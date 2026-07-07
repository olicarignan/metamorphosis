import type { Font } from "fontkit";
import type { GlyphMorphOptions, NormGlyph } from "./types";
import { resolveFont } from "./font/resolve";
import { normalizeGlyph } from "./glyph/normalize";
import { pairGlyphs } from "./glyph/pair";
import { contourToD } from "./glyph/d";
import { spring as resolveSpring, springEasingFn } from "../shared/spring";
import {
  type ReducedMotionState,
  createReducedMotionListener,
} from "../shared/reduced-motion";

const SVG_NS = "http://www.w3.org/2000/svg";

export const DEFAULT_GLYPH_MORPH_OPTIONS = {
  color: "currentColor",
  duration: 400,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  disabled: false,
  respectReducedMotion: true,
} as const satisfies Omit<GlyphMorphOptions, "element" | "font">;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (n: number) => Math.round(n * 10000) / 10000;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class GlyphMorph {
  private element: HTMLElement;
  private options: Omit<GlyphMorphOptions, "element" | "ease"> & { ease: string };
  private easingFn: (t: number) => number;

  private font: Font | null = null;
  private ascent = 0; // em
  private descent = 0; // em

  private svg: SVGSVGElement | null = null;
  private pathEl: SVGPathElement | null = null;
  private mounted = false; // svg (vs. a text fallback) is in the host element

  private shownChar: string | null = null;
  private current: NormGlyph | null = null; // rendered glyph; null while showing text
  private pendingChar: string | null = null; // desired char while the font loads

  private isInitialRender = true;
  private rafId: number | null = null;
  private reducedMotion: ReducedMotionState | null = null;
  private destroyed = false;

  constructor(options: GlyphMorphOptions) {
    const { ease: rawEase, ...rest } = {
      ...DEFAULT_GLYPH_MORPH_OPTIONS,
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

    resolveFont(options.font)
      .then((font) => this.onFontReady(font))
      .catch((err) => {
        // Stay in the plain-text fallback if the font can't be loaded/parsed.
        if (typeof console !== "undefined") console.warn(err);
      });
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.reducedMotion?.destroy();
    this.element.replaceChildren();
  }

  private isDisabled(): boolean {
    return Boolean(
      this.options.disabled || this.reducedMotion?.prefersReducedMotion,
    );
  }

  private onFontReady(font: Font) {
    if (this.destroyed) return;
    this.font = font;
    this.ascent = font.ascent / font.unitsPerEm;
    this.descent = -font.descent / font.unitsPerEm; // descent is negative
    if (this.pendingChar != null) {
      const char = this.pendingChar;
      this.pendingChar = null;
      this.update(char);
    }
  }

  update(char: string) {
    // Font not parsed yet: show the character as text and remember it.
    if (!this.font) {
      this.pendingChar = char;
      this.showText(char);
      return;
    }

    const target = normalizeGlyph(this.font, char);

    // Unsupported glyph or whitespace: fall back to a plain text node.
    if (!target) {
      this.current = null;
      this.shownChar = char;
      this.showText(char);
      return;
    }

    if (char === this.shownChar && this.current) return; // already shown

    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.build();
    this.mount();
    this.svg!.setAttribute("aria-label", char);

    // Initial render, disabled, or coming from a text fallback: snap, no morph.
    if (this.isInitialRender || this.isDisabled() || !this.current) {
      this.isInitialRender = false;
      this.current = target;
      this.shownChar = char;
      this.apply(target);
      return;
    }

    this.options.onAnimationStart?.();

    const { from, to } = pairGlyphs(this.current, target);
    this.shownChar = char;

    const duration = this.options.duration!;
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const frame = (now: number) => {
      const raw = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      const t = this.easingFn(raw);

      const state = interpolate(from, to, t);
      this.current = state;
      this.apply(state);

      if (raw < 1) {
        this.rafId = requestAnimationFrame(frame);
      } else {
        this.rafId = null;
        this.current = target; // settle on the clean (unpadded) target
        this.apply(target);
        this.options.onAnimationComplete?.();
      }
    };

    this.rafId = requestAnimationFrame(frame);
  }

  // --- rendering -----------------------------------------------------------

  private build() {
    if (this.svg) return;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("fill", this.options.color!);
    svg.setAttribute("stroke", "none");
    svg.setAttribute("role", "img");
    svg.style.display = "inline-block";
    svg.style.overflow = "visible"; // glyphs may extend past the advance box
    // Push the box down by the descent so the glyph baseline (at y=ascent in the
    // viewBox) lands on the surrounding text's baseline.
    svg.style.verticalAlign = `${-this.descent}em`;

    // A single path holds every contour so counters/holes (wound opposite to the
    // outline) subtract under fill-rule: nonzero, instead of painting solid.
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("fill-rule", "nonzero");
    svg.appendChild(path);

    this.svg = svg;
    this.pathEl = path;
  }

  private mount() {
    if (this.mounted) return;
    this.element.replaceChildren(this.svg!);
    this.mounted = true;
  }

  private showText(char: string) {
    this.element.replaceChildren(document.createTextNode(char));
    this.mounted = false;
  }

  private apply(glyph: NormGlyph) {
    const width = glyph.advance;
    const height = this.ascent + this.descent;
    const svg = this.svg!;
    svg.setAttribute("viewBox", `0 0 ${round(width)} ${round(height)}`);
    svg.style.width = `${round(width)}em`;
    svg.style.height = `${round(height)}em`;

    // Concatenate every contour's subpath into one `d`; opposite windings then
    // subtract as holes under fill-rule: nonzero.
    let d = "";
    for (const c of glyph.contours) d += contourToD(c.pts);
    this.pathEl!.setAttribute("d", d);
  }
}

function interpolate(from: NormGlyph, to: NormGlyph, t: number): NormGlyph {
  const contours = from.contours.map((fc, i) => {
    const tc = to.contours[i]!;
    const pts = fc.pts.map((p, j) => {
      const q = tc.pts[j]!;
      return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t) };
    });
    return {
      pts,
      centroid: {
        x: lerp(fc.centroid.x, tc.centroid.x, t),
        y: lerp(fc.centroid.y, tc.centroid.y, t),
      },
    };
  });
  return {
    contours,
    advance: lerp(from.advance, to.advance, t),
    ascent: from.ascent,
    descent: from.descent,
  };
}
