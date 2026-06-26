// Shared "cascade" morph styling — the numericText-style roll used across the
// demo (calendar stepper, live clock, playground readout, gauge values).
//
// The roll itself ships in the package behind the `cascade` prop. Here we just
// pair it with the spring tuned to the glass-buttons date selector:
// `.spring(response: 0.25, dampingFraction: 0.5)` converts to
// stiffness = (2π / response)² ≈ 632 and damping = 2 · ζ · √stiffness; we bump
// the damping a little past the faithful 25 (ζ = 0.5) to ζ ≈ 0.6 to take some
// of the bounce off.
export const CASCADE_SPRING = { stiffness: 632, damping: 30 };

/**
 * Cascade morph props for a TextMorph: the packaged cascade animation plus our
 * spring. The vertical roll distance is derived from each element's font size,
 * so the same props work at any type scale.
 */
export function cascadeProps() {
  return {
    granularity: "grapheme",
    ease: CASCADE_SPRING,
    cascade: true,
  };
}
