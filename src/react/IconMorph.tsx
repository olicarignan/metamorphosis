"use client";

import React from "react";
import { DEFAULT_ICON_AS } from "../icon-morph";
import { IconMorphController } from "../icon-morph/controller";
import type { IconMorphOptions, IconDef } from "../icon-morph/types";

export type IconMorphProps = Omit<IconMorphOptions, "element"> & {
  /** Name of a built-in (or registered) icon to display and morph to. */
  name: string;
  /** Optional inline icon definition; when set it's used instead of `name`. */
  icon?: IconDef;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
};

export const IconMorph = ({
  name,
  icon,
  className,
  style,
  as = DEFAULT_ICON_AS,
  ...props
}: IconMorphProps) => {
  const { ref, update } = useIconMorph(props);

  React.useEffect(() => {
    update(name, icon);
  }, [name, icon, update]);

  const Component = as;

  return (
    <Component
      ref={ref}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
};

export function useIconMorph(props: Omit<IconMorphOptions, "element">) {
  const ref = React.useRef<HTMLElement | null>(null);
  const controllerRef = React.useRef(new IconMorphController());

  const configKey = IconMorphController.serializeConfig(props);

  React.useEffect(() => {
    if (ref.current) {
      controllerRef.current.attach(ref.current, props);
    }

    return () => {
      controllerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  const update = React.useCallback((name: string, icon?: IconDef) => {
    controllerRef.current.update(name, icon);
  }, []);

  return { ref, update };
}
