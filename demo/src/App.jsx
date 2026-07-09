import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TextMorph, IconMorph, GlyphMorph, GlyphWord } from "../../src/react";
import { iconNames } from "../../src/icon-morph";
import { IconLink } from "./IconLink";
import { cascadeProps } from "./cascade";

// Suisse Intl Regular — the same WOFF2 the demo text renders in, so morphing
// glyphs match their neighbors' weight, size, and baseline. fontkit reads WOFF2
// directly (bundled brotli); the parsed font is cached per URL, so every
// GlyphMorph on the page shares a single fetch + parse.
const GLYPH_FONT = "/fonts/SuisseIntl/Suisse%20Intl%20Regular.woff2";

// A gentler, slower morph for the install/usage snippets — a smooth, symmetric
// ease-in-out (vs. the default snappy easeOutQuint) over a longer duration, so
// characters glide in and out rather than snapping into place.
const SMOOTH_MORPH = {
  ease: "cubic-bezier(0.33, 1, 0.68, 1)",
  duration: 350,
};

// A springy morph shared by the glyph demos (pricing, score) — a touch of bounce
// as the outlines settle.
const GLYPH_SPRING = { stiffness: 180, damping: 22 };

// Install command per package manager — the morph target for the install tabs.
const INSTALL = [
  { id: "pnpm", cmd: "pnpm i github:olicarignan/metamorphosis" },
  { id: "npm", cmd: "npm i github:olicarignan/metamorphosis" },
  { id: "bun", cmd: "bun i github:olicarignan/metamorphosis" },
  { id: "yarn", cmd: "yarn add github:olicarignan/metamorphosis" },
];

// Usage snippets — the pills in the usage section switch between them.
const USAGE = [
  {
    id: "text",
    label: "Text",
    code: `import { TextMorph } from "metamorphosis/react";

<TextMorph>{value}</TextMorph>;`,
  },
  {
    id: "glyph",
    label: "Glyph",
    code: `import { GlyphMorph } from "metamorphosis/react";

<GlyphMorph char={digit} font="/fonts/Inter.woff2" />;`,
  },
  {
    id: "icon",
    label: "Icon",
    code: `import { IconMorph } from "metamorphosis/react";

<IconMorph name={open ? "close" : "menu"} />;`,
  },
];

// An auto-cycling status pill morphs between these two states — the label morphs
// (TextMorph) while a bespoke SVG badge completes its ring from a 3/4-circle
// spinner into a checkmark badge.
const STATUS_STATES = [
  { label: "Processing Transaction", confirmed: false },
  { label: "Transaction Approved", confirmed: true },
];

// Pricing plans — the same per-month price at monthly vs. annual billing. Kept
// the same length ("$24" / "$19") so every digit reshapes on toggle rather than
// a new slot popping in.
const PLANS = [
  { id: "monthly", label: "Monthly", price: "$24" },
  { id: "yearly", label: "Yearly", price: "$19" },
];

// A random letter matching the original's case, so hovering a title letter swaps
// it for a same-cased glyph (uppercase "M" stays uppercase, and so on).
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randomLetterLike = (orig) => {
  const isUpper = orig === orig.toUpperCase() && orig !== orig.toLowerCase();
  const pool = isUpper ? UPPER : LOWER;
  return pool[Math.floor(Math.random() * pool.length)];
};

export default function App() {
  return (
    <main className="page">
      <div className="container">
        <header className="page__header">
          <RevealTitle>Metamorphosis</RevealTitle>
          <p className="page__subtitle">
            A morphing animation library for words, glyphs and icons.
          </p>
        </header>

        <div className="demos">
          {/* State morph — an auto-cycling status pill: the label morphs
              (TextMorph) while a bespoke SVG badge completes from a spinner into
              a checkmark badge */}
          <StatusDemo />

          {/* Cascade — step through calendar days, morphing the date label */}
          <CalendarStepper />

          {/* Icon morph — a button cycling through every bundled icon */}
          <IconCycleDemo />

          {/* Glyph word — a pricing card whose digits reshape on toggle */}
          <PricingDemo />

          {/* Random number — cascade-rolls a new value on re-roll */}
          <ScoreDemo />

          {/* Icon morph — a copy-to-clipboard button morphing to a checkmark */}
          <CopyMorphDemo />

          {/* Install / usage — sits inside the wireframe grid as a final row */}
          <section className="page__install">
            <h2>Install</h2>
            <InstallTabs />
            <h3>Usage</h3>
            <UsageTabs />
          </section>
        </div>

        <section className="credits">
          <p className="install__link">
            For documentation, check the project on{" "}
            <a
              href="https://github.com/olicarignan/metamorphosis"
              target="_blank"
              rel="noopener noreferrer"
            >
              Github
            </a>
          </p>
          <div className="credit">
            <span>Made by</span>
            <IconLink href="https://oliviercarignan.com">
              Olivier Carignan
            </IconLink>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Reveals its text on mount with a per-letter rise, then makes each letter
 * interactive: hovering a letter morphs its font outline into a random glyph
 * (GlyphMorph) and morphs it back on leave. The letters keep their final layout
 * from the start (only opacity/transform animate on reveal), so the title never
 * shifts. The accessible name stays the real word via `aria-label`.
 */
function RevealTitle({ children }) {
  const title = String(children);
  const chars = useMemo(() => [...title], [title]);
  const [display, setDisplay] = useState(chars);

  const setChar = (i, ch) =>
    setDisplay((prev) => {
      const next = prev.slice();
      next[i] = ch;
      return next;
    });

  return (
    <h1 className="page__title" aria-label={title}>
      {chars.map((char, i) =>
        char === " " ? (
          <span key={i} aria-hidden="true" className="page__title-char">
            {" "}
          </span>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="page__title-char"
            style={{ animationDelay: `${i * 0.04}s` }}
            onMouseEnter={() => setChar(i, randomLetterLike(char))}
            onMouseLeave={() => setChar(i, char)}
          >
            <GlyphMorph
              char={display[i]}
              font={GLYPH_FONT}
              color="#fff"
              ease={{ stiffness: 320, damping: 26 }}
            />
          </span>
        ),
      )}
    </h1>
  );
}

/**
 * Status pill — a transaction status that auto-cycles between pending and
 * approved. The label morphs (TextMorph) while a StatusBadge completes its ring
 * from a spinning 3/4-circle spinner into a checkmark badge.
 */
function StatusDemo() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setI((n) => (n + 1) % STATUS_STATES.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  const state = STATUS_STATES[i];

  return (
    <section className="demo demo--status">
      <div className="demo__container wide">
        <div className="status">
          <span className="status__icon">
            <StatusBadge confirmed={state.confirmed} />
          </span>
          {/* Word granularity so the shared "Transaction" segment persists and
              slides intact between states, rather than reshuffling per-letter.
              The default 400ms morph feels rushed against the ~2.6s state hold,
              so slow it to let the words glide (same ease-out as the badge). */}
          <TextMorph
            className="status__label"
            granularity="word"
            duration={650}
            ease="cubic-bezier(0.22, 1, 0.36, 1)"
          >
            {state.label}
          </TextMorph>
        </div>
      </div>
    </section>
  );
}

/**
 * A success badge that doubles as a loading spinner. Two stacked states crossfade
 * with a slight shrink on toggle: a spinning 3/4 arc while pending, and a solid
 * circular badge with a checkmark cut out (SVG mask) whose curve draws on once
 * confirmed. Only the inner glyphs scale — the svg box stays fixed, so there is
 * no layout shift.
 */
function StatusBadge({ confirmed }) {
  return (
    <svg
      className={`status-badge${confirmed ? " is-confirmed" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <defs>
        {/* White keeps the disc; the black check stroke knocks a checkmark-shaped
            hole out of it. Drawing the stroke on reveals the cutout as a curve. */}
        <mask id="status-check-cutout">
          <rect width="24" height="24" fill="white" />
          <path
            className="status-badge__check"
            d="M7.5 12.5l3 3 5.5-6"
            fill="none"
            stroke="black"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>

      {/* Spinner state — a spinning 3/4 arc, crossfading out on confirm. */}
      <g className="status-badge__spinner">
        <circle className="status-badge__arc" cx="12" cy="12" r="9" />
      </g>

      {/* Badge state — a solid disc with the checkmark cut out, crossfading in. */}
      <g className="status-badge__badge">
        <circle
          className="status-badge__disc"
          cx="12"
          cy="12"
          r="9"
          mask="url(#status-check-cutout)"
        />
      </g>
    </svg>
  );
}

/**
 * Pricing card — a Monthly·Yearly segmented toggle over a large price rendered
 * with GlyphWord, so each digit reshapes its font outline as the plan changes.
 */
function PricingDemo() {
  const [active, setActive] = useState(0);
  const plan = PLANS[active];

  return (
    <section className="demo demo--pricing">
      <div className="demo__container wide">
        <div className="pricing">
          <div className="pricing__price">
            <GlyphWord
              word={plan.price}
              font={GLYPH_FONT}
              color="var(--text-strong)"
              ease={GLYPH_SPRING}
            />
            <span className="pricing__suffix">/mo</span>
          </div>
          <Tabs
            items={PLANS}
            active={active}
            onChange={setActive}
            ariaLabel="Billing period"
            getLabel={(p) => p.label}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Random number — a large number rendered with TextMorph. Re-rolling picks a new
 * value in 0–999 and the digits cascade-roll into place.
 */
function ScoreDemo() {
  const [score, setScore] = useState(42);

  const reroll = () =>
    setScore((s) => {
      let n;
      do {
        n = Math.floor(Math.random() * 1000);
      } while (n === s);
      return n;
    });

  return (
    <section className="demo demo--score">
      <div className="demo__container wide">
        <div className="score">
          <div className="score__value">
            <TextMorph className="score__number" {...cascadeProps()}>
              {String(score)}
            </TextMorph>
          </div>
          <button type="button" className="score__button" onClick={reroll}>
            Re-roll
          </button>
        </div>
      </div>
    </section>
  );
}

// Best-effort clipboard write. Prefers the async Clipboard API (secure contexts)
// and falls back to a hidden-textarea + execCommand for insecure contexts like
// http://<lan-ip> on a phone, where navigator.clipboard is unavailable.
function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }
}

/**
 * Copy button — a glass pill pairing a copy-to-clipboard icon that morphs into a
 * checkmark on click (IconMorph) with a label that morphs "copy" → "copied"
 * (TextMorph), both reverting after a short beat.
 */
function CopyMorphDemo() {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = () => {
    // Fire the morph on every tap. The demo is about the morph, so the visual
    // feedback must not hinge on the clipboard write — which throws in insecure
    // contexts (e.g. viewing the dev server over http://<lan-ip> on a phone,
    // where navigator.clipboard is undefined).
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
    copyText("npm i github:olicarignan/metamorphosis");
  };

  return (
    <section className="demo demo--copy">
      <div className="demo__container wide">
        <button
          type="button"
          className="copy-morph"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy install command"}
        >
          <IconMorph
            name={copied ? "check" : "copy"}
            size={20}
            strokeWidth={2}
            ease={GLYPH_SPRING}
          />
          {/* A hidden sizer holding the wider word pins the label slot's width,
              so the centered pill never resizes (and re-centers) as the label
              morphs and settles — which otherwise reads as a jump. */}
          <span className="copy-morph__label">
            <TextMorph className="copy-morph__text">
              {copied ? "copied" : "copy"}
            </TextMorph>
          </span>
        </button>
      </div>
    </section>
  );
}

// Every bundled icon, resolved once — the cycle demo steps through these in order.
const ICON_NAMES = iconNames();

/**
 * Icon gallery — a glass disc button that morphs through every bundled IconMorph
 * icon in turn, wrapping back to the first at the end.
 */
function IconCycleDemo() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % ICON_NAMES.length);

  return (
    <section className="demo demo--icons">
      <div className="demo__container wide">
        <button
          type="button"
          className="icon-cycle"
          onClick={next}
          aria-label={`Next icon (${ICON_NAMES[index]})`}
        >
          <IconMorph
            name={ICON_NAMES[index]}
            size={32}
            strokeWidth={2}
            ease={GLYPH_SPRING}
          />
        </button>
      </div>
    </section>
  );
}

/**
 * A row of pill tabs with two moving glass pieces behind the labels: the solid
 * glass pill slides/resizes to the active tab, and a translucent ghost pill
 * follows the cursor across tabs on hover (fading out when the row is left).
 * Positions are measured from each button's box so the pills track any label
 * width, and re-measure on resize.
 */
function Tabs({ items, active, onChange, ariaLabel, getLabel }) {
  const listRef = useRef(null);
  const btnRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const [ghost, setGhost] = useState({ left: 0, width: 0, visible: false });

  // Subpixel-exact box of tab i, relative to the tab row (so the glass pill
  // lands precisely on the button rather than an integer-rounded approximation).
  const rectFor = (i) => {
    const btn = btnRefs.current[i];
    const list = listRef.current;
    if (!btn || !list) return null;
    const b = btn.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    return { left: b.left - l.left, width: b.width };
  };

  // Snap the glass pill onto the active tab. useLayoutEffect so the first paint
  // already has the pill in place (no grow-from-zero on mount); later changes
  // animate via the CSS transition.
  useLayoutEffect(() => {
    const measure = () => {
      const r = rectFor(active);
      if (r) setPill(r);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, items]);

  const moveGhost = (i) => {
    // The active tab already wears the glass pill; don't stack the ghost on it.
    if (i === active) {
      setGhost((g) => ({ ...g, visible: false }));
      return;
    }
    const r = rectFor(i);
    if (r) setGhost({ ...r, visible: true });
  };

  // On select, drop the ghost first so it isn't left stacked under the glass
  // pill as it slides onto the newly active tab.
  const handleSelect = (i) => {
    setGhost((g) => ({ ...g, visible: false }));
    onChange(i);
  };

  return (
    <div
      className="install__tabs"
      role="tablist"
      aria-label={ariaLabel}
      ref={listRef}
      onMouseLeave={() => setGhost((g) => ({ ...g, visible: false }))}
    >
      <span
        className="install__tab-pill"
        aria-hidden="true"
        style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
      />
      <span
        className={`install__tab-ghost${ghost.visible ? " is-visible" : ""}`}
        aria-hidden="true"
        style={{ transform: `translateX(${ghost.left}px)`, width: ghost.width }}
      />
      {items.map((item, i) => (
        <button
          key={item.id}
          ref={(el) => (btnRefs.current[i] = el)}
          type="button"
          role="tab"
          aria-selected={i === active}
          className={i === active ? "is-active" : undefined}
          onClick={() => handleSelect(i)}
          onMouseEnter={() => moveGhost(i)}
        >
          <span className="install__tab-label">{getLabel(item)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Install snippet with package-manager tabs. The command is wrapped in a
 * TextMorph so switching tabs morphs one command into the next, and a copy
 * button morphs from a copy icon to a checkmark once the command is copied.
 */
function InstallTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="install">
      <Tabs
        items={INSTALL}
        active={active}
        onChange={setActive}
        ariaLabel="Package manager"
        getLabel={(m) => m.id}
      />

      <div className="install__command">
        <div className="install__scroll">
          <TextMorph
            className="install__code"
            granularity="grapheme"
            {...SMOOTH_MORPH}
          >
            {INSTALL[active].cmd}
          </TextMorph>
        </div>

        <CopyButton
          key={active}
          text={INSTALL[active].cmd}
          label="Copy install command"
        />
      </div>
    </div>
  );
}

/**
 * Usage snippet with pills to switch between the text-morph and icon-morph
 * examples. Selecting a pill swaps the rendered code and its copy target.
 */
function UsageTabs() {
  const [active, setActive] = useState(0);
  const code = USAGE[active].code;
  const lines = code.split("\n");

  return (
    <div className="install">
      <Tabs
        items={USAGE}
        active={active}
        onChange={setActive}
        ariaLabel="Usage example"
        getLabel={(u) => u.label}
      />

      <div className="usage">
        <pre>
          {/* One TextMorph per line so switching pills morphs the code, while
              the line breaks are preserved (a single morph would collapse them). */}
          <code>
            {lines.map((line, i) => (
              <span key={i} className="usage__line">
                <TextMorph granularity="grapheme" {...SMOOTH_MORPH}>
                  {line || " "}
                </TextMorph>
              </span>
            ))}
          </code>
        </pre>
        <CopyButton
          key={active}
          className="install__copy--corner"
          text={code}
          label="Copy usage code"
        />
      </div>
    </div>
  );
}

/**
 * Copy-to-clipboard button whose copy icon morphs into a checkmark on success,
 * then back after a beat. Shared by the install command and the usage snippet.
 */
function CopyButton({ text, label = "Copy", className = "" }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = () => {
    // Show the copied state on every tap, independent of the clipboard write —
    // which throws in insecure contexts (e.g. the dev server over http://<lan-ip>
    // on a phone), leaving the button looking unresponsive.
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1500);
    copyText(text);
  };

  return (
    <button
      type="button"
      className={`install__copy${copied ? " is-copied" : ""}${
        className ? ` ${className}` : ""
      }`}
      onClick={copy}
      aria-label={copied ? "Copied" : label}
    >
      <span className="install__copy-icons">
        <span className="install__copy-icon install__copy-icon--copy">
          <CopyIcon />
        </span>
        <span className="install__copy-icon install__copy-icon--check">
          <CheckIcon />
        </span>
      </span>
    </button>
  );
}

const CopyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 4H5C4.44772 4 4 4.44772 4 5V10C4 10.5523 4.44772 11 5 11H10C10.5523 11 11 10.5523 11 10V5C11 4.44772 10.5523 4 10 4Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 8C1.45 8 1 7.55 1 7V2C1 1.45 1.45 1 2 1H7C7.55 1 8 1.45 8 2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Vertical arrow, ported from the glass-buttons date selector. Points up by
// default; the previous-day button flips it with CSS.
const ArrowIcon = () => (
  <svg
    width="20"
    height="22"
    viewBox="0 0 20 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 3v16M10 3 4 9M10 3l6 6" />
  </svg>
);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// The day label, mirroring the SwiftUI date selector: relative names for the
// nearby days, an explicit short date otherwise.
function dayLabel(offset, date) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Secondary weekday line — only the relative days show it (like the original).
// Non-relative days morph to a blank line so the row keeps its height.
function dayDetail(offset, date) {
  if (Math.abs(offset) > 1) return " ";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Calendar-day stepper: an on-brand take on the glass-buttons date selector.
 * The chevrons step the day and the label morphs from one value to the next.
 */
function CalendarStepper() {
  const [offset, setOffset] = useState(0);

  const date = useMemo(() => {
    const d = startOfToday();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  return (
    <section className="demo demo--stepper">
      <div className="demo__container wide">
        <div className="stepper">
          <button
            type="button"
            className="stepper__button stepper__button--prev"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous day"
          >
            <ArrowIcon />
          </button>

          <div className="stepper__display" aria-live="polite">
            <TextMorph className="stepper__label" {...cascadeProps()}>
              {dayLabel(offset, date)}
            </TextMorph>
            <TextMorph className="stepper__detail" {...cascadeProps()}>
              {dayDetail(offset, date)}
            </TextMorph>
          </div>

          <button
            type="button"
            className="stepper__button stepper__button--next"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Next day"
          >
            <ArrowIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
