import { GlyphMorph } from "./engine";
import type { GlyphMorphOptions } from "./types";

export class GlyphMorphController {
  private instance: GlyphMorph | null = null;
  private last: string | null = null;
  private configKey = "";

  attach(element: HTMLElement, options: Omit<GlyphMorphOptions, "element">) {
    this.instance?.destroy();
    this.instance = new GlyphMorph({ element, ...options });
    this.configKey = GlyphMorphController.serializeConfig(options);

    if (this.last != null) {
      this.instance.update(this.last);
    }
  }

  update(char: string) {
    this.last = char;
    this.instance?.update(char);
  }

  needsRecreate(options: Omit<GlyphMorphOptions, "element">): boolean {
    return GlyphMorphController.serializeConfig(options) !== this.configKey;
  }

  destroy() {
    this.instance?.destroy();
    this.instance = null;
  }

  static serializeConfig(options: Omit<GlyphMorphOptions, "element">): string {
    return JSON.stringify({
      // ArrayBuffers can't be serialized; key them by size (they're normally a
      // stable reference anyway, so this only needs to be good enough).
      font:
        typeof options.font === "string"
          ? options.font
          : `buffer:${options.font.byteLength}`,
      color: options.color,
      ease: options.ease,
      duration: options.duration,
      disabled: options.disabled,
      respectReducedMotion: options.respectReducedMotion,
    });
  }
}
