"use client";

import React from "react";
import { DEFAULT_GLYPH_AS } from "../glyph-morph";
import { GlyphMorphController } from "../glyph-morph/controller";
import type { GlyphMorphOptions } from "../glyph-morph/types";

export type GlyphMorphProps = Omit<GlyphMorphOptions, "element"> & {
  /** The single character to display; its glyph morphs whenever it changes. */
  char: string;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
};

const escapeHTML = (s: string) =>
  s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));

export const GlyphMorph = ({
  char,
  className,
  style,
  as = DEFAULT_GLYPH_AS,
  ...props
}: GlyphMorphProps) => {
  const { ref, update } = useGlyphMorph(props);

  // Render the character as initial content (SSR / no-JS accessibility). Once
  // mounted the engine owns the host's children; the stable ref keeps React from
  // reconciling them, so subsequent morphs go through `update()`, not the DOM.
  const initialHTML = React.useRef({ __html: escapeHTML(char) });

  React.useEffect(() => {
    update(char);
  }, [char, update]);

  const Component = as;

  return (
    <Component
      ref={ref}
      className={className}
      style={style}
      dangerouslySetInnerHTML={initialHTML.current}
    />
  );
};

export function useGlyphMorph(props: Omit<GlyphMorphOptions, "element">) {
  const ref = React.useRef<HTMLElement | null>(null);
  const controllerRef = React.useRef(new GlyphMorphController());

  const configKey = GlyphMorphController.serializeConfig(props);

  React.useEffect(() => {
    if (ref.current) {
      controllerRef.current.attach(ref.current, props);
    }

    return () => {
      controllerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const update = React.useCallback((char: string) => {
    controllerRef.current.update(char);
  }, []);

  return { ref, update };
}

export type GlyphWordProps = Pick<
  GlyphMorphProps,
  | "char"
  | "font"
  | "color"
  | "duration"
  | "ease"
  | "disabled"
  | "respectReducedMotion"
  | "onAnimationStart"
  | "onAnimationComplete"
> & {
  /** The surrounding word; all glyphs share the same `font`. */
  word: string;
  /** Index within `word` of the character that morphs (`char` drives it). */
  morphAt: number;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
};

/**
 * A word with a single inline morphing slot: renders the text before/after
 * `morphAt` as plain characters and the character at that index as a
 * `<GlyphMorph>`, so one letter/number morphs in place while the rest stays put.
 */
export const GlyphWord = ({
  word,
  morphAt,
  as = DEFAULT_GLYPH_AS,
  className,
  style,
  ...glyphProps
}: GlyphWordProps) => {
  const Component = as;
  const before = word.slice(0, morphAt);
  const after = word.slice(morphAt + 1);

  return (
    <Component className={className} style={style}>
      {before}
      <GlyphMorph {...glyphProps} />
      {after}
    </Component>
  );
};
