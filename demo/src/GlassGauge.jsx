import { useRef, useState, useCallback } from "react";

const PILL_WIDTH = 28;

/**
 * An Apple-style "liquid glass" gauge: a frosted, recessed capsule track with a
 * lit fill and a draggable glass pill. The pill reuses the demo's shared glass
 * surface (--glass-fill / highlight / bevel / shadow) — the same frosted look as
 * the stepper buttons — so it sits naturally on the green-glass theme.
 */
export function GlassGauge({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const ratio = (value - min) / (max - min);

  const valueFromClientX = useCallback(
    (clientX) => {
      const el = trackRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      // Map the pointer across the pill's travel (inset by half a pill on each
      // end) so dropping the pill lands its center under the cursor.
      const usable = rect.width - PILL_WIDTH;
      const x = clientX - rect.left - PILL_WIDTH / 2;
      const r = usable > 0 ? Math.min(1, Math.max(0, x / usable)) : 0;
      const raw = min + r * (max - min);
      const snapped = Math.round(raw / step) * step;
      return Math.min(max, Math.max(min, snapped));
    },
    [min, max, step, value],
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      onChange(valueFromClientX(e.clientX));
    },
    [onChange, valueFromClientX],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      onChange(valueFromClientX(e.clientX));
    },
    [dragging, onChange, valueFromClientX],
  );

  const handlePointerUp = useCallback((e) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      let next = value;
      if (e.key === "ArrowRight" || e.key === "ArrowUp")
        next = Math.min(max, value + step);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown")
        next = Math.max(min, value - step);
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      else return;
      e.preventDefault();
      onChange(next);
    },
    [value, min, max, step, onChange],
  );

  // Pill center / fill edge: half a pill in, then proportional across the rest.
  const position = `calc(${PILL_WIDTH / 2}px + ${ratio} * (100% - ${PILL_WIDTH}px))`;

  return (
    <div
      ref={trackRef}
      className={`glass-gauge ${dragging ? "glass-gauge--dragging" : ""}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <div className="glass-gauge__well">
        <div className="glass-gauge__fill" style={{ width: position }} />
      </div>
      <div className="glass-gauge__pill" style={{ left: position }} />
    </div>
  );
}
