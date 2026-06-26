# metamorphosis

A dependency-free **morphing animation library**. It ships two morphers:

- **Text** — text that morphs character-by-character (or word-by-word) between
  values. Core `MorphController` plus a React adapter (`TextMorph`, `useTextMorph`).
- **Icons** — a three-line icon component where any icon smoothly morphs into any
  other. React adapter (`IconMorph`, `useIconMorph`) plus a framework-agnostic
  `IconMorphController`.

## Install

As a git dependency (no npm publish needed):

```bash
pnpm add github:olicarignan/metamorphosis
```

The package has a `prepare` script, so the consumer's install builds `dist/`
automatically from source.

Peer deps (for the React adapter): `react`, `react-dom` (>=18). They're
optional — the framework-agnostic core works without React.

## Usage (React)

```jsx
import { TextMorph } from "metamorphosis/react";

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
import { useTextMorph } from "metamorphosis/react";

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
import { MorphController } from "metamorphosis";

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
import { IconMorph } from "metamorphosis/react";

<IconMorph name={open ? "close" : "menu"} />;
```

Every icon is exactly **three SVG lines** in a shared 24×24 box, so any icon can
morph into any other: each of the three line segments interpolates from the old
position to the new one. Icons that need fewer lines collapse the extras to an
invisible point at the center, and icons that are the same shape at different
rotations (like arrows) **rotate** instead of moving points — taking the shortest
way around.

### Built-in icons

`menu`, `close`, `plus`, `minus`, `equals`, `check`, `play`, `pause`,
`arrow-up` / `arrow-right` / `arrow-down` / `arrow-left`, and
`chevron-up` / `chevron-right` / `chevron-down` / `chevron-left`.

```jsx
import { iconNames } from "metamorphosis/icon-morph";

iconNames(); // -> ["menu", "close", "plus", ...]
```

### Custom icons

Register your own three-line icon (a fourth line is ignored; fewer are padded
with collapsed center points). Coordinates are in the 24×24 box, `rotation` is in
degrees:

```js
import { registerIcon } from "metamorphosis/icon-morph";

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
| `ease`                 | `string \| SpringParams`   | ease-out         | CSS easing string, or a spring config (see above).       |
| `disabled`             | `boolean`                  | `false`          | Swap instantly with no animation.                        |
| `respectReducedMotion` | `boolean`                  | `true`           | Honor `prefers-reduced-motion`.                          |
| `onAnimationStart`     | `() => void`               | —                | Called when a morph begins (not on initial render).      |
| `onAnimationComplete`  | `() => void`               | —                | Called when a morph finishes.                            |

React-only props: `as` (host element, default `"span"`), `className`, `style`.

### Core (framework-agnostic)

```js
import { IconMorphController } from "metamorphosis/icon-morph";

const icon = new IconMorphController();
icon.attach(element, { size: 28, ease: { stiffness: 200, damping: 14 } });
icon.update("menu");
icon.update("close"); // morphs
// icon.destroy() to tear down
```

There's also a `useIconMorph` hook mirroring `useTextMorph` for full control over
the host element.

## Develop

```bash
pnpm install
pnpm build      # tsup → dist/ (esm + cjs + d.ts)
pnpm dev        # watch mode
```

The `demo/` directory is a Vite app showcasing every prop (granularity, spring
presets, a live stiffness/damping playground, copy-to-clipboard morphs, and the
three-line icon morph).

```bash
cd demo && pnpm install && pnpm dev
```
