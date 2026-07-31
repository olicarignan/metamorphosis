# metamorphosis

metamorphosis is a library for morph animations. The library has three morphers:

- **Text** — This morpher changes text from one value to another value. It
  morphs one character at a time, or one word at a time. Use the core
  `MorphController`, or the React adapter (`TextMorph`, `useTextMorph`).
- **Icons** — This morpher shows a line-drawn icon. The icon can morph
  smoothly into a different icon. Use the React adapter (`IconMorph`,
  `useIconMorph`), or the framework-agnostic `IconMorphController`.
- **Glyphs** — This morpher shows one character. The real outline of the
  font shape morphs into the outline of the next character. Use
  `GlyphMorph`, `GlyphWord`, `useGlyphMorph`, or `GlyphMorphController`.

The text morpher and the icon morpher do not need other packages. The glyph
morpher needs the `fontkit` package. The library uses `fontkit` to read font
outlines.

## Install

```bash
pnpm add @ocarignan/metamorphosis
# or: npm install @ocarignan/metamorphosis
```

The React adapter needs `react` and `react-dom`, version 18 or later, as
peer dependencies. These packages are optional. The core morphers work
without React.

## Usage (React)

```jsx
import { TextMorph } from "@ocarignan/metamorphosis/react";

<TextMorph as="h3">{title}</TextMorph>;
```

`TextMorph` accepts text content only. Valid content types are strings,
numbers, and expressions that give a string or a number. Do not pass a
React element as content: this makes `TextMorph` throw an error. When the
text changes, `TextMorph` animates from the old value to the new value.

### Per-letter morphing

By default, `TextMorph` splits the text into words if the text contains a
space. If the text has no space, `TextMorph` splits the text into single
characters. Use the `granularity` prop to set the split type:

```jsx
<TextMorph granularity="grapheme">{value}</TextMorph>  {/* always per-letter */}
<TextMorph granularity="word">{value}</TextMorph>      {/* always per-word   */}
```

### Spring easing

The `ease` prop accepts a CSS easing string, or a spring configuration
object. If you give a spring configuration, metamorphosis calculates a
`linear()` easing value and a duration from the spring physics. In this
case, metamorphosis ignores the `duration` prop:

```jsx
<TextMorph ease={{ stiffness: 180, damping: 12 }}>{value}</TextMorph>
```

## Props / options

This table applies to `<TextMorph>` and to the core `MorphController`.

| Prop                   | Type                          | Default                            | Description                                                                                 |
| ---------------------- | ----------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `duration`             | `number` (ms)                 | `400`                              | Sets the morph duration. metamorphosis ignores this prop if `ease` is a spring object.       |
| `ease`                 | `string \| SpringParams`      | `cubic-bezier(0.22, 1, 0.36, 1)`   | Sets a CSS easing string, or a spring configuration. See the spring configuration table below.|
| `granularity`          | `"auto" \| "word" \| "grapheme"` | `"auto"`                        | Sets how metamorphosis splits the text. `auto`: split into words if the text has a space; if not, split into characters. |
| `scale`                | `boolean`                     | `true`                             | If `true`, entering and exiting segments change size. If `false`, segments only move.        |
| `cascade`              | `boolean`                     | `false`                            | If `true`, use the cascade animation. See the cascade animation section below.               |
| `enterSlide`           | `number` (px)                 | —                                  | Sets the vertical slide distance for the cascade animation. Set this prop alone to turn on the slide. |
| `stagger`              | `number` (ms)                 | —                                  | Sets the delay between segments in the cascade animation. Set to `0` to start all new segments at the same time. |
| `disabled`             | `boolean`                     | `false`                            | If `true`, skip the animation. metamorphosis sets the text content directly.                 |
| `respectReducedMotion` | `boolean`                     | `true`                             | If `true`, obey the `prefers-reduced-motion` setting. If the user sets this setting, metamorphosis acts as if `disabled` is `true`. |
| `locale`               | `Intl.LocalesArgument`        | `"en"`                             | Sets the locale for `Intl.Segmenter`. metamorphosis uses this locale to split text into characters or words. |
| `debug`                | `boolean`                     | `false`                            | If `true`, add a debug attribute. Use this attribute to examine the segment boxes.           |
| `onAnimationStart`     | `() => void`                  | —                                  | metamorphosis calls this function when a morph starts. metamorphosis does not call this function on the first render. |
| `onAnimationComplete`  | `() => void`                  | —                                  | metamorphosis calls this function when the container size transition ends.                   |

These props work only with the React adapter: `as` (the element type;
default value: `"span"`), `className`, and `style`.

### `SpringParams`

| Param       | Type     | Default | Description                                                          |
| ----------- | -------- | ------- | ---------------------------------------------------------------------|
| `stiffness` | `number` | `100`   | Sets the spring stiffness. A higher value gives a faster, sharper motion. |
| `damping`   | `number` | `10`    | Sets the spring damping. A lower value gives more bounce. A higher value stops the motion faster. |
| `mass`      | `number` | `1`     | Sets the mass of the moving object.                                  |
| `precision` | `number` | `0.001` | Sets the settle threshold. metamorphosis uses this value to calculate the derived duration. |

### Cascade animation

Set `cascade` to `true` to replace the default morph with a vertical roll
animation. This animation is like the `numericText` content transition in
SwiftUI. Use this animation for counters, clocks, and number pickers. New
segments rise from below and fade in. Old segments roll up and fade out.
Segments do not change size. New segments start at different times, from
left to right:

```jsx
<TextMorph cascade granularity="grapheme" ease={{ stiffness: 632, damping: 30 }}>
  {value}
</TextMorph>
```

metamorphosis calculates the roll distance from the font size of the
element. This calculation makes the `cascade` prop work correctly at any
font size. Use a spring value for `ease` to add bounce to the animation.
To control the roll distance and the timing, set `enterSlide` (in pixels)
and `stagger` (in milliseconds). These props override the calculated
values:

```jsx
{/* a taller roll, no stagger */}
<TextMorph cascade enterSlide={28} stagger={0}>{value}</TextMorph>
```

## The `useTextMorph` hook

To get full control of the element, use the hook directly:

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

metamorphosis exports the controller from the root package. Use this
controller without React:

```js
import { MorphController } from "@ocarignan/metamorphosis";

const controller = new MorphController();
controller.attach(element, { granularity: "grapheme", ease: { stiffness: 200, damping: 14 } });
controller.update("hello");
controller.update("world");
// controller.destroy() to tear down
```

metamorphosis also exports `DEFAULT_TEXT_MORPH_OPTIONS` and `DEFAULT_AS`.
Use these exports to get the default values at runtime.

## Icon morphing

`IconMorph` shows an icon. When the `name` prop changes, `IconMorph`
morphs smoothly to the new icon:

```jsx
import { IconMorph } from "@ocarignan/metamorphosis/react";

<IconMorph name={open ? "close" : "menu"} />;
```

Each icon uses a maximum of six SVG lines, in a 24 by 24 box. Because of
this limit, any icon can morph into any other icon: each line moves from
its old position to its new position. If an icon needs fewer than six
lines, the extra lines collapse to an invisible point at the center of the
box. Some icons have the same shape at a different rotation, for example
the arrow icons. For these icons, the icon rotates; the points do not
move. The rotation uses the shortest direction.

### Built-in icons

`menu`, `close`, `plus`, `minus`, `equals`, `check`, `copy`, `play`, `pause`,
`arrow-up` / `arrow-right` / `arrow-down` / `arrow-left`, and
`chevron-up` / `chevron-right` / `chevron-down` / `chevron-left`.

```jsx
import { iconNames } from "@ocarignan/metamorphosis/icon-morph";

iconNames(); // -> ["menu", "close", "plus", ...]
```

### Custom icons

Use `registerIcon` to add your own line icon. An icon can have a maximum
of six line segments. metamorphosis ignores segments beyond the sixth. If
an icon has fewer than six segments, metamorphosis adds collapsed center
points to fill the remaining segments. Give coordinates in the 24 by 24
box. Give `rotation` in degrees:

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

You can also pass a definition directly with the `icon` prop. In this
case, `name` is only an identity key. metamorphosis uses this key to
detect a change:

```jsx
<IconMorph name="my-shape" icon={{ lines: [[4, 4, 20, 20], [20, 4, 4, 20]], rotation: 0 }} />;
```

### Icon props

| Prop                   | Type                       | Default          | Description                                                            |
| ---------------------- | --------------------------- | ---------------- | ------------------------------------------------------------------------|
| `name`                 | `string`                   | —                | Sets the icon to show. This can be a built-in icon or a registered icon. `IconMorph` morphs when this value changes. |
| `icon`                 | `IconDef`                  | —                | Sets an inline icon definition. `IconMorph` uses this definition instead of looking up `name`. |
| `size`                 | `number` (px)              | `24`             | Sets the size of the rendered square, in pixels.                       |
| `strokeWidth`          | `number`                   | `2`              | Sets the stroke width, in the 24-unit icon space.                      |
| `color`                | `string`                   | `"currentColor"` | Sets the stroke color.                                                 |
| `duration`             | `number` (ms)              | `400`            | Sets the morph duration. metamorphosis ignores this prop if `ease` is a spring. |
| `ease`                 | `string \| SpringParams`   | `cubic-bezier(0.22, 1, 0.36, 1)` | Sets a CSS easing string, or a spring configuration. See the spring configuration table above. |
| `disabled`             | `boolean`                  | `false`          | If `true`, switch icons instantly. `IconMorph` does not animate the switch. |
| `respectReducedMotion` | `boolean`                  | `true`           | If `true`, obey the `prefers-reduced-motion` setting.                  |
| `onAnimationStart`     | `() => void`               | —                | metamorphosis calls this function when a morph starts. metamorphosis does not call this function on the first render. |
| `onAnimationComplete`  | `() => void`               | —                | metamorphosis calls this function when a morph ends.                   |

These props work only with the React adapter: `as` (the host element;
default value: `"span"`), `className`, and `style`.

### Core (framework-agnostic)

```js
import { IconMorphController } from "@ocarignan/metamorphosis/icon-morph";

const icon = new IconMorphController();
icon.attach(element, { size: 28, ease: { stiffness: 200, damping: 14 } });
icon.update("menu");
icon.update("close"); // morphs
// icon.destroy() to tear down
```

metamorphosis also has a `useIconMorph` hook. This hook works like
`useTextMorph`. Use this hook to get full control of the host element.

## Glyph morphing

`GlyphMorph` shows a single character. When the `char` prop changes,
`GlyphMorph` morphs the font outline of the old character into the font
outline of the new character. This method uses the same technique as the
icon morpher, applied to a real glyph. `GlyphMorph` reads the outline
from a font that you specify. Because of this, the morphing character
matches the family, weight, size, and baseline of the surrounding text.

```jsx
import { GlyphMorph } from "@ocarignan/metamorphosis/react";

<GlyphMorph char={digit} font="/fonts/Inter.woff2" />;
```

metamorphosis flattens the outline of each glyph. metamorphosis then
resamples the contours of the outline to a common point count.
metamorphosis then interpolates the points, one by one. Two glyphs can
have a different number of contours and still morph correctly. For
example, the letters `8`, `o`, and `A` have an extra hole, or counter,
inside the shape. During a morph, this hole can grow from a point, or
collapse into a point. This method is the same method that the icon
morpher uses to collapse an unused line to the center point.

> The glyph morpher uses the [`fontkit`](https://github.com/foliojs/fontkit)
> package to read font outlines. metamorphosis loads this package only
> when needed. The glyph morpher reads `.ttf`, `.otf`, `.woff`, and
> `.woff2` font files. The `fontkit` package includes the WOFF2
> decompressor. The glyph morpher can also select a specific weight from
> a variable font. Note: the glyph morpher is the only morpher that needs
> a runtime dependency. The text morpher and the icon morpher need no
> runtime dependencies.

### Letters in a word

`GlyphWord` shows a word as text. The word has one or more inline
morphing slots. Each slot can morph a single letter or number, while the
rest of the word stays the same:

```jsx
import { GlyphWord } from "@ocarignan/metamorphosis/react";

{/* only the third letter morphs: "co d e" → "co r e" */}
<GlyphWord word={word} morphAt={2} font="/fonts/Inter.woff2" />;

{/* every character morphs as the time ticks */}
<GlyphWord word={time} font="/fonts/Inter.woff2" />;
```

The `word` prop supplies the text. Each morphing slot takes its glyph
from this text. The `morphAt` prop selects which characters morph. Give a
single index, or a list of indices. If you omit `morphAt`, every
character morphs. All glyphs use the same `font` value.

### Glyph props

| Prop                   | Type                       | Default          | Description                                                            |
| ---------------------- | --------------------------- | ---------------- | ------------------------------------------------------------------------|
| `char`                 | `string`                   | —                | Sets the character to show. `GlyphMorph` morphs when this value changes. |
| `font`                 | `string \| ArrayBuffer`    | —                | Sets the font. Give a font URL, or preloaded font bytes. `GlyphMorph` reads the outline from this font. |
| `color`                | `string`                   | `"currentColor"` | Sets the fill color of the glyph.                                       |
| `duration`             | `number` (ms)              | `400`            | Sets the morph duration. metamorphosis ignores this prop if `ease` is a spring. |
| `blur`                 | `number` (em)              | `0.02`           | Sets the peak blur value, in em units. The blur increases, then decreases, during the morph. Set to `0` to turn off the blur. |
| `blurEnd`              | `number` (0–1)             | `0.5`            | Sets the point in the morph when the blur returns to 0, as a fraction from 0 to 1. After this point, the glyph is sharp. A lower value clears the blur earlier. |
| `blurCurve`            | `number`                   | `2`              | Sets the shape of the blur curve. At `1`, the curve is a plain sine curve. A higher value gives less blur near the start and the end of the morph. |
| `ease`                 | `string \| SpringParams`   | `cubic-bezier(0.22, 1, 0.36, 1)` | Sets a CSS easing string, or a spring configuration. |
| `disabled`             | `boolean`                  | `false`          | If `true`, switch characters instantly. `GlyphMorph` does not animate the switch. |
| `respectReducedMotion` | `boolean`                  | `true`           | If `true`, obey the `prefers-reduced-motion` setting.                  |
| `onAnimationStart`     | `() => void`               | —                | metamorphosis calls this function when a morph starts. metamorphosis does not call this function on the first render. |
| `onAnimationComplete`  | `() => void`               | —                | metamorphosis calls this function when a morph ends.                   |

These props work only with the React adapter: `as` (the host element;
default value: `"span"`), `className`, and `style`.

`GlyphMorph` shows the character as plain text in two cases: while the
font loads, and when the font has no glyph for the character (for
example, whitespace or an unsupported character).

The glyph renders as an `<svg>` element. The fill color is set by `color`
(default value: `currentColor`). Some pages apply a gradient to text with
the CSS properties `background-clip: text` and `color: transparent`.
This gradient trick does not work with `GlyphMorph`, because the trick
applies only to real text glyphs, not to an `<svg>` element. If the
surrounding text uses this trick, `currentColor` is transparent, and the
glyph does not show. To fix this, pass an explicit value for `color`, or
set a solid `color` on the container.

### Core (framework-agnostic)

```js
import { GlyphMorphController } from "@ocarignan/metamorphosis/glyph-morph";

const glyph = new GlyphMorphController();
glyph.attach(element, { font: "/fonts/Inter.woff2", ease: { stiffness: 180, damping: 16 } });
glyph.update("3");
glyph.update("8"); // morphs
// glyph.destroy() to tear down
```

metamorphosis also has a `useGlyphMorph` hook. This hook works like the
other hooks.

## Develop

```bash
pnpm install
pnpm build      # tsup → dist/ (esm + cjs + d.ts)
pnpm dev        # watch mode
```

The `demo/` directory has a Vite app. This app shows an example of each
morpher:

- A transaction status pill that cycles automatically. This example uses
  the text morpher and an SVG badge.
- A calendar-day stepper and a random-number re-roll. These examples use
  the cascade roll.
- A line-drawn icon that morphs through every bundled icon.
- A pricing card. The digits of the price change their font outline when
  you toggle the billing period. This example uses the glyph morpher.
- A copy-to-clipboard button that morphs into a checkmark.
- Install and usage code snippets that morph when you switch tabs.

```bash
cd demo && pnpm install && pnpm dev
```
