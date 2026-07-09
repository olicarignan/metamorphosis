# metamorphosis

A **morphing animation library**. It ships three morphers:

- **Text** — text that morphs character-by-character (or word-by-word) between
  values. Core `MorphController` plus a React adapter (`TextMorph`, `useTextMorph`).
- **Icons** — a line-drawn icon component where any icon smoothly morphs into any
  other. React adapter (`IconMorph`, `useIconMorph`) plus a framework-agnostic
  `IconMorphController`.
- **Glyphs** — a single character whose real font outline morphs into the next
  (`GlyphMorph`, `GlyphWord`, `useGlyphMorph`, `GlyphMorphController`).

Text and icons are dependency-free; glyph morphing uses `fontkit` to
read font outlines.

## Install

```bash
pnpm add @ocarignan/metamorphosis
# or: npm install @ocarignan/metamorphosis
```

Peer deps (for the React adapter): `react`, `react-dom` (>=18). They're
optional — the framework-agnostic core works without React.

## Usage (React)

```jsx
import { TextMorph } from "@ocarignan/metamorphosis/react";

<TextMorph as="h3">{title}</TextMorph>;
```

`TextMorph` accepts **text content only** (strings, numbers, or expressions that
resolve to those) — passing a React element throws. Whenever the text changes,
it animates from the old value to the new one.

### Per-letter morphing

By default the text is split into words when it contains a space, otherwise into
individual characters. Force one or the other with `granularity`:

```jsx
<TextMorph granularity="grapheme">{value}</TextMorph>  {/* always per-letter */}
<TextMorph granularity="word">{value}</TextMorph>      {/* always per-word   */}
```

### Spring easing

`ease` accepts a CSS easing string, or a spring config object. When given a
spring, metamorphosis derives a `linear()` easing **and** a duration from the
physics (the `duration` prop is ignored in that case):

```jsx
<TextMorph ease={{ stiffness: 180, damping: 12 }}>{value}</TextMorph>
```

## Props / options

These apply to both `<TextMorph>` and the core `MorphController`.

| Prop                   | Type                          | Default                            | Description                                                                                 |
| ---------------------- | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| `duration`             | `number` (ms)                 | `400`                              | Morph duration. Ignored when `ease` is a spring object (duration is derived from physics).  |
| `ease`                 | `string \| SpringParams`      | `cubic-bezier(0.22, 1, 0.36, 1)`   | CSS easing string, or a spring config (see below) that derives easing + duration.           |
| `granularity`          | `"auto" \| "word" \| "grapheme"` | `"auto"`                        | How text is segmented. `auto` = words if there's a space, else graphemes.                    |
| `scale`                | `boolean`                     | `true`                             | Scale segments as they enter/exit, not just translate them.                                 |
| `cascade`              | `boolean`                     | `false`                            | Use the "cascade" animation (see below) instead of the default morph.                        |
| `enterSlide`           | `number` (px)                 | —                                  | Override the cascade animation's vertical slide distance. Set on its own to enable the slide.|
| `stagger`              | `number` (ms)                 | —                                  | Override the cascade animation's per-segment stagger. `0` enters all new segments at once.   |
| `disabled`             | `boolean`                     | `false`                            | Skip animation and set text content directly.                                               |
| `respectReducedMotion` | `boolean`                     | `true`                             | Honor `prefers-reduced-motion`; when reduced, behaves as if `disabled`.                      |
| `locale`               | `Intl.LocalesArgument`        | `"en"`                             | Locale used to segment text into graphemes/words (`Intl.Segmenter`).                         |
| `debug`                | `boolean`                     | `false`                            | Add a debug attribute for inspecting segment boxes.                                          |
| `onAnimationStart`     | `() => void`                  | —                                  | Called when a morph begins (not on the initial render).                                      |
| `onAnimationComplete`  | `() => void`                  | —                                  | Called when a morph's container-size transition finishes.                                    |

React-only props: `as` (element type, default `"span"`), `className`, `style`.

### `SpringParams`

| Param       | Type     | Default | Description                                              |
| ----------- | -------- | ------- | -------------------------------------------------------- |
| `stiffness` | `number` | `100`   | Spring stiffness — higher is faster/snappier.           |
| `damping`   | `number` | `10`    | Damping — lower oscillates (bouncy), higher settles.    |
| `mass`      | `number` | `1`     | Mass of the moving body.                                |
| `precision` | `number` | `0.001` | Settle threshold used to compute the derived duration.  |

### Cascade animation

Set `cascade` to swap the default morph for a vertical roll modeled on SwiftUI's
`numericText` content transition — ideal for counters, clocks, and number
pickers. Entering segments rise up from below and fade in, exiting segments roll
up and out, there's no scale, and entrances are staggered left to right:

```jsx
<TextMorph cascade granularity="grapheme" ease={{ stiffness: 632, damping: 30 }}>
  {value}
</TextMorph>
```

The roll distance is derived from the element's font size, so the same `cascade`
prop looks right at any type scale. Pair it with a spring `ease` for the bounce.
For fine control, `enterSlide` (px) and `stagger` (ms) override the auto-derived
values:

```jsx
{/* a taller roll, no stagger */}
<TextMorph cascade enterSlide={28} stagger={0}>{value}</TextMorph>
```

## The `useTextMorph` hook

For full control over the element, use the hook directly:

```jsx
import { useTextMorph } from "@ocarignan/metamorphosis/react";

function Counter({ value }) {
  const { ref, update } = useTextMorph({ granularity: "grapheme" });

  useEffect(() => {
    update(String(value));
  }, [value, update]);

  return <span ref={ref}>{value}</span>;
}
```

## Core (framework-agnostic)

The controller is exported from the root for use without React:

```js
import { MorphController } from "@ocarignan/metamorphosis";

const controller = new MorphController();
controller.attach(element, { granularity: "grapheme", ease: { stiffness: 200, damping: 14 } });
controller.update("hello");
controller.update("world");
// controller.destroy() to tear down
```

`DEFAULT_TEXT_MORPH_OPTIONS` and `DEFAULT_AS` are also exported if you need the
defaults at runtime.

## Icon morphing

`IconMorph` renders an icon and smoothly morphs it into another whenever its
`name` changes:

```jsx
import { IconMorph } from "@ocarignan/metamorphosis/react";

<IconMorph name={open ? "close" : "menu"} />;
```

Every icon is drawn from a shared budget of **up to six SVG lines** in a 24×24
box, so any icon can morph into any other: each line segment interpolates from the
old position to the new one. Icons that need fewer lines collapse the extras to an
invisible point at the center, and icons that are the same shape at different
rotations (like arrows) **rotate** instead of moving points — taking the shortest
way around.

### Built-in icons

`menu`, `close`, `plus`, `minus`, `equals`, `check`, `copy`, `play`, `pause`,
`arrow-up` / `arrow-right` / `arrow-down` / `arrow-left`, and
`chevron-up` / `chevron-right` / `chevron-down` / `chevron-left`.

```jsx
import { iconNames } from "@ocarignan/metamorphosis/icon-morph";

iconNames(); // -> ["menu", "close", "plus", ...]
```

### Custom icons

Register your own line icon — up to six segments (any beyond six are ignored;
fewer are padded with collapsed center points). Coordinates are in the 24×24 box,
`rotation` is in degrees:

```js
import { registerIcon } from "@ocarignan/metamorphosis/icon-morph";

registerIcon("divide", {
  lines: [
    [4, 12, 20, 12], // the bar
    [12, 6, 12, 6],  // top dot (a short, near-zero segment)
    [12, 18, 12, 18] // bottom dot
  ],
});

<IconMorph name="divide" />;
```

Or pass a definition inline with the `icon` prop (the `name` is then just an
identity key used to detect changes):

```jsx
<IconMorph name="my-shape" icon={{ lines: [[4, 4, 20, 20], [20, 4, 4, 20]], rotation: 0 }} />;
```

### Icon props

| Prop                   | Type                       | Default          | Description                                              |
| ---------------------- | -------------------------- | ---------------- | -------------------------------------------------------- |
| `name`                 | `string`                   | —                | Built-in/registered icon to show. Morphs when it changes.|
| `icon`                 | `IconDef`                  | —                | Inline definition; used instead of looking up `name`.    |
| `size`                 | `number` (px)              | `24`             | Rendered square size.                                    |
| `strokeWidth`          | `number`                   | `2`              | Stroke width in the 24-unit icon space.                  |
| `color`                | `string`                   | `"currentColor"` | Stroke color.                                            |
| `duration`             | `number` (ms)              | `400`            | Morph duration. Ignored when `ease` is a spring.         |
| `ease`                 | `string \| SpringParams`   | `cubic-bezier(0.22, 1, 0.36, 1)` | CSS easing string, or a spring config (see above).       |
| `disabled`             | `boolean`                  | `false`          | Swap instantly with no animation.                        |
| `respectReducedMotion` | `boolean`                  | `true`           | Honor `prefers-reduced-motion`.                          |
| `onAnimationStart`     | `() => void`               | —                | Called when a morph begins (not on initial render).      |
| `onAnimationComplete`  | `() => void`               | —                | Called when a morph finishes.                            |

React-only props: `as` (host element, default `"span"`), `className`, `style`.

### Core (framework-agnostic)

```js
import { IconMorphController } from "@ocarignan/metamorphosis/icon-morph";

const icon = new IconMorphController();
icon.attach(element, { size: 28, ease: { stiffness: 200, damping: 14 } });
icon.update("menu");
icon.update("close"); // morphs
// icon.destroy() to tear down
```

There's also a `useIconMorph` hook mirroring `useTextMorph` for full control over
the host element.

## Glyph morphing

`GlyphMorph` renders a single character and morphs its **font outline** into the
next whenever `char` changes — the icon-morph technique applied to a real glyph.
It reads the outline from a font you point it at, so the morphing character
matches the surrounding text's family, weight, size, and baseline.

```jsx
import { GlyphMorph } from "@ocarignan/metamorphosis/react";

<GlyphMorph char={digit} font="/fonts/Inter.woff2" />;
```

Each glyph's outline is flattened, its contours resampled to a common point
count, and then interpolated point-by-point. Glyphs with a different number of
contours still morph cleanly: an extra hole or counter (the inside of an `8`,
`o`, or `A`) grows out of — or collapses into — a point, the same way icon-morph
collapses an unused line to the center.

> Glyph morphing uses [`fontkit`](https://github.com/foliojs/fontkit) (a runtime
> dependency, loaded lazily) to read outlines. It reads `.ttf`, `.otf`, and
> `.woff`/`.woff2` (fontkit bundles the WOFF2 decompressor), and can instance a
> variable font to match a specific weight. This is the one morpher that isn't
> dependency-free — text and icon have no runtime dependencies.

### Letters in a word

`GlyphWord` renders a word as text with one or more inline morphing slots, so
individual letters or numbers morph in place while the rest stays put:

```jsx
import { GlyphWord } from "@ocarignan/metamorphosis/react";

{/* only the third letter morphs: "co d e" → "co r e" */}
<GlyphWord word={word} morphAt={2} font="/fonts/Inter.woff2" />;

{/* every character morphs as the time ticks */}
<GlyphWord word={time} font="/fonts/Inter.woff2" />;
```

`word` supplies the text and each morphing slot takes its glyph from that word.
`morphAt` selects which characters morph — a single index or a list of indices;
omit it to morph every character. All glyphs share `font`.

### Glyph props

| Prop                   | Type                       | Default          | Description                                              |
| ---------------------- | -------------------------- | ---------------- | -------------------------------------------------------- |
| `char`                 | `string`                   | —                | The character to display. Morphs when it changes.        |
| `font`                 | `string \| ArrayBuffer`    | —                | Font URL, or preloaded bytes, to read the outline from.  |
| `color`                | `string`                   | `"currentColor"` | Fill color of the glyph.                                 |
| `duration`             | `number` (ms)              | `400`            | Morph duration. Ignored when `ease` is a spring.         |
| `blur`                 | `number` (em)              | `0.02`           | Peak blur, ramped in/out during the morph; `0` disables. |
| `blurEnd`              | `number` (0–1)             | `0.5`            | Fraction of the morph by which blur has risen and fallen back to 0 (glyph is crisp for the rest). Lower clears earlier. |
| `blurCurve`            | `number`                   | `2`              | Shoulder sharpness of the blur envelope. `1` is a plain sine bell; higher lingers less at the edges. |
| `ease`                 | `string \| SpringParams`   | `cubic-bezier(0.22, 1, 0.36, 1)` | CSS easing string, or a spring config.   |
| `disabled`             | `boolean`                  | `false`          | Swap instantly with no animation.                        |
| `respectReducedMotion` | `boolean`                  | `true`           | Honor `prefers-reduced-motion`.                          |
| `onAnimationStart`     | `() => void`               | —                | Called when a morph begins (not on initial render).      |
| `onAnimationComplete`  | `() => void`               | —                | Called when a morph finishes.                            |

React-only props: `as` (host element, default `"span"`), `className`, `style`.
While the font loads — and for any character the font has no glyph for
(whitespace, unsupported) — the plain character renders as text.

The glyph is an `<svg>` filled with `color` (default `currentColor`). If the
surrounding text uses the `background-clip: text` + `color: transparent` gradient
trick, `currentColor` is transparent and the glyph won't show — that clip applies
to text glyphs, not to a replaced `<svg>`. Pass an explicit `color` (or set a
solid `color` on the container) so the glyph has something to paint with.

### Core (framework-agnostic)

```js
import { GlyphMorphController } from "@ocarignan/metamorphosis/glyph-morph";

const glyph = new GlyphMorphController();
glyph.attach(element, { font: "/fonts/Inter.woff2", ease: { stiffness: 180, damping: 16 } });
glyph.update("3");
glyph.update("8"); // morphs
// glyph.destroy() to tear down
```

There's also a `useGlyphMorph` hook mirroring the other morphers.

## Develop

```bash
pnpm install
pnpm build      # tsup → dist/ (esm + cjs + d.ts)
pnpm dev        # watch mode
```

The `demo/` directory is a Vite app showcasing the morphers: cycling text,
the cascade roll (a calendar stepper and a live clock), the line-drawn icon
morph, a live clock whose seconds digit morphs its font outline (glyph morph),
and copy-to-clipboard install/usage snippets that morph as you switch tabs.

```bash
cd demo && pnpm install && pnpm dev
```
