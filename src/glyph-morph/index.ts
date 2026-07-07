export { GlyphMorph, DEFAULT_GLYPH_MORPH_OPTIONS } from "./engine";
export { GlyphMorphController } from "./controller";
export { resolveFont } from "./font/resolve";
export { normalizeGlyph } from "./glyph/normalize";

export type { GlyphMorphOptions, NormGlyph, NormContour, Pt } from "./types";
export type { SpringParams } from "../shared/spring";

export const DEFAULT_GLYPH_AS = "span";
