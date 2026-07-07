import type { Font, FontCollection } from "fontkit";

/**
 * A library-neutral outline command, in font units (y-up). This is the only
 * shape the rest of the pipeline sees, so swapping the underlying font library
 * only touches this file. Field names mirror SVG path commands.
 */
export type GlyphCommand =
  | { type: "M"; x: number; y: number }
  | { type: "L"; x: number; y: number }
  | { type: "Q"; x1: number; y1: number; x: number; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "Z" };

/** A glyph's raw outline and metrics, all in font units (y-up). */
export type RawGlyph = {
  commands: GlyphCommand[];
  advanceWidth: number;
  unitsPerEm: number;
  ascender: number; // font.ascent
  descender: number; // font.descent (negative, below baseline)
};

// fontkit is a runtime dependency loaded lazily via dynamic import, so it only
// enters the bundle graph of consumers that actually use glyph morphing. Its
// browser build reads WOFF2 (bundled brotli) and can instance variable fonts.
let fontkitPromise: Promise<typeof import("fontkit")> | null = null;
function loadFontkit() {
  if (!fontkitPromise) fontkitPromise = import("fontkit");
  return fontkitPromise;
}

// One parse per font, shared across every GlyphMorph instance. URLs key a string
// Map; preloaded buffers key a WeakMap so they can be GC'd with the buffer.
const byUrl = new Map<string, Promise<Font>>();
const byBuffer = new WeakMap<ArrayBuffer, Promise<Font>>();

async function parse(buffer: ArrayBuffer): Promise<Font> {
  const fontkit = await loadFontkit();
  // fontkit's browser build accepts a Uint8Array; @types insists on Buffer.
  const created = fontkit.create(new Uint8Array(buffer) as never);
  return asFont(created);
}

// `create` may return a collection (.ttc/.dfont); take its first face.
function asFont(font: Font | FontCollection): Font {
  if ("glyphForCodePoint" in font) return font;
  const first = font.fonts[0];
  if (!first) throw new Error("metamorphosis GlyphMorph: empty font collection");
  return first;
}

/** Fetch (if given a URL) and parse a font, memoized by source. */
export function resolveFont(source: string | ArrayBuffer): Promise<Font> {
  if (typeof source === "string") {
    let cached = byUrl.get(source);
    if (!cached) {
      cached = fetch(source)
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `metamorphosis GlyphMorph: failed to fetch font "${source}" (${res.status})`,
            );
          }
          return res.arrayBuffer();
        })
        .then(parse);
      byUrl.set(source, cached);
    }
    return cached;
  }

  let cached = byBuffer.get(source);
  if (!cached) {
    cached = parse(source);
    byBuffer.set(source, cached);
  }
  return cached;
}

/**
 * The raw outline for a single character, or `null` when the font has no glyph
 * for it or the glyph has no contours (whitespace) — in which case the caller
 * renders the plain character as text instead.
 */
export function getRawGlyph(font: Font, char: string): RawGlyph | null {
  const cp = char.codePointAt(0);
  if (cp == null || !font.hasGlyphForCodePoint(cp)) return null;

  const glyph = font.glyphForCodePoint(cp);
  const commands = toNeutral(glyph.path.commands);
  if (!commands.length) return null; // no outline (e.g. space)

  return {
    commands,
    advanceWidth: glyph.advanceWidth,
    unitsPerEm: font.unitsPerEm,
    ascender: font.ascent,
    descender: font.descent,
  };
}

function toNeutral(
  commands: { command: string; args: number[] }[],
): GlyphCommand[] {
  const out: GlyphCommand[] = [];
  for (const { command, args } of commands) {
    switch (command) {
      case "moveTo":
        out.push({ type: "M", x: args[0]!, y: args[1]! });
        break;
      case "lineTo":
        out.push({ type: "L", x: args[0]!, y: args[1]! });
        break;
      case "quadraticCurveTo":
        out.push({ type: "Q", x1: args[0]!, y1: args[1]!, x: args[2]!, y: args[3]! });
        break;
      case "bezierCurveTo":
        out.push({
          type: "C",
          x1: args[0]!,
          y1: args[1]!,
          x2: args[2]!,
          y2: args[3]!,
          x: args[4]!,
          y: args[5]!,
        });
        break;
      case "closePath":
        out.push({ type: "Z" });
        break;
    }
  }
  return out;
}
