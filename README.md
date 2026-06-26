# metamorphosis

A dependency-free **animated text component** — text that morphs character-by-
character (or word-by-word) between values. This package ships the core
`MorphController` plus a thin React adapter (`TextMorph`, `useTextMorph`).

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

## Develop

```bash
pnpm install
pnpm build      # tsup → dist/ (esm + cjs + d.ts)
pnpm dev        # watch mode
```

The `demo/` directory is a Vite app showcasing every prop (granularity, spring
presets, a live stiffness/damping playground, and copy-to-clipboard morphs).

```bash
cd demo && pnpm install && pnpm dev
```
