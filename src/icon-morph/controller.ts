import { IconMorph } from "./engine";
import type { IconMorphOptions, IconDef } from "./types";

export class IconMorphController {
  private instance: IconMorph | null = null;
  private last: { name: string; icon?: IconDef } | null = null;
  private configKey = "";

  attach(element: HTMLElement, options: Omit<IconMorphOptions, "element">) {
    this.instance?.destroy();
    this.instance = new IconMorph({ element, ...options });
    this.configKey = IconMorphController.serializeConfig(options);

    if (this.last) {
      this.instance.update(this.last.name, this.last.icon);
    }
  }

  update(name: string, icon?: IconDef) {
    this.last = { name, icon };
    this.instance?.update(name, icon);
  }

  needsRecreate(options: Omit<IconMorphOptions, "element">): boolean {
    return IconMorphController.serializeConfig(options) !== this.configKey;
  }

  destroy() {
    this.instance?.destroy();
    this.instance = null;
  }

  static serializeConfig(options: Omit<IconMorphOptions, "element">): string {
    return JSON.stringify({
      size: options.size,
      strokeWidth: options.strokeWidth,
      color: options.color,
      ease: options.ease,
      duration: options.duration,
      disabled: options.disabled,
      respectReducedMotion: options.respectReducedMotion,
    });
  }
}
