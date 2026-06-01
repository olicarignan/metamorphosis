# text-morph

A dependency-free **animated text component** — text that morphs character-by-
character between values. This package ships the core `MorphController` plus a
thin React adapter (`TextMorph`, `useTextMorph`).

## Install

As a git dependency (no npm publish needed):

```bash
pnpm add github:olicarignan/text-morph
# or pin a commit/tag:  pnpm add github:olicarignan/text-morph#v0.0.9
```

The package has a `prepare` script, so the consumer's install builds `dist/`
automatically from source.

Peer deps (for the React adapter): `react`, `react-dom` (>=18).

## Usage (React)

```jsx
import { TextMorph } from "text-morph/react";

<TextMorph as="h3">{title}</TextMorph>;
```

`TextMorph` accepts text content only (strings / numbers / expressions), plus
`as`, `className`, `style`, and the morph options (`duration`, `ease`, `scale`,
`disabled`, `respectReducedMotion`, `locale`, `onAnimationStart`,
`onAnimationComplete`).

The framework-agnostic core is also exported from the root:

```js
import { MorphController } from "text-morph";
```

## Develop

```bash
pnpm install
pnpm build      # tsup → dist/ (esm + cjs + d.ts)
pnpm dev        # watch mode
```
