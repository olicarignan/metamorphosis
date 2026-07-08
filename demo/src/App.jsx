import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TextMorph, IconMorph, GlyphWord } from "../../src/react";
import { IconLink } from "./IconLink";
import { cascadeProps } from "./cascade";

const WORDS = [
  "transform",
  "animate",
  "mutate",
  "metamorphose",
  "shift",
  "permute",
];
// Live clock — always the time with seconds, ticking each second.
const clockFormat = (d) => d.toLocaleTimeString("en-GB", { hour12: false });

// A gentler, slower morph for the install/usage snippets — a smooth, symmetric
// ease-in-out (vs. the default snappy easeOutQuint) over a longer duration, so
// characters glide in and out rather than snapping into place.
const SMOOTH_MORPH = {
  ease: "cubic-bezier(0.33, 1, 0.68, 1)",
  duration: 350,
};

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

export default function App() {
  const [wordIndex, setWordIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());

  // Cycle the hero word on a timer.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Tick the live clock every second.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="page__header">
          <RevealTitle>Metamorphosis</RevealTitle>
          <p className="page__subtitle">
            A dependency-free morphing animation library
          </p>
        </header>

        <div className="demos">
          <section className="demo">
            <div className="demo__container wide">
              <span className="demo__label">Word Morph</span>
              <TextMorph className="demo__text">{WORDS[wordIndex]}</TextMorph>
            </div>
          </section>

          {/* Glyph morphing — the seconds' ones digit morphs via its font outline */}
          <GlyphMorphDemo now={now} />

          {/* Cascade — the live clock, rolling each second */}
          <section className="demo">
            <div className="demo__container wide">
              <span className="demo__label">Cascade</span>
              <TextMorph className="demo__text" {...cascadeProps()}>
                {clockFormat(now)}
              </TextMorph>
            </div>
          </section>

          {/* Cascade — step through calendar days, morphing the date label */}
          <CalendarStepper />

          {/* Icon morphing — every icon is three lines; tap to morph */}
          <IconMorphDemo />

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
 * Reveals its text on mount with the same logic as the stepper morph — each
 * letter fades in and slides up from below, staggered left to right. The
 * letters occupy their final layout from the start (only opacity/transform
 * animate), so the title never shifts as it appears. Driven by CSS so the
 * easing stays smooth and the section reveals can be timed against it.
 */
function RevealTitle({ children }) {
  const title = String(children);
  return (
    <h1 className="page__title" aria-label={title}>
      {[...title].map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="page__title-char"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </h1>
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
  if (Math.abs(offset) > 1) return " ";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Each icon is exactly three SVG lines, so any of these morphs smoothly into
// the next. The arrows share one shape and only differ by rotation; the others
// move points and collapse unused lines to the center.
const ICON_SEQUENCE = [
  "menu",
  "close",
  "plus",
  "minus",
  "equals",
  "check",
  "play",
  "pause",
  "arrow-up",
  "arrow-right",
  "arrow-down",
  "arrow-left",
  "chevron-down",
];

/**
 * Icon morph showcase. Tapping the button advances through the sequence; the
 * single three-line icon morphs from whichever shape it is into the next one.
 */
function IconMorphDemo() {
  const [i, setI] = useState(0);
  const name = ICON_SEQUENCE[i];

  return (
    <section className="demo demo--icon">
      <div className="demo__container wide">
        <span className="demo__label">Icon Morph</span>
        <div className="stepper">
          <button
            type="button"
            className="stepper__button"
            onClick={() => setI((n) => (n + 1) % ICON_SEQUENCE.length)}
            aria-label={`Morph to next icon (currently ${name})`}
          >
            <IconMorph name={name} size={26} strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}

// Suisse Intl Regular — the same WOFF2 the demo text renders in, so the morphing
// glyph matches its neighbors' weight, size, and baseline. fontkit reads WOFF2
// directly (bundled brotli); opentype.js could not.
const GLYPH_FONT = "/fonts/SuisseIntl/Suisse%20Intl%20Regular.woff2";

/**
 * Glyph morph showcase, driven by the same ticking clock as the cascade demo:
 * the time renders in the page font and every digit morphs in place — its font
 * outline reshaping into the next digit whenever it ticks — while the colons
 * stay static. Multiple numbers morphing throughout a word.
 *
 * The morph's subtle blur (peak amount, when it clears, and ramp-down
 * sharpness) is tuned via the GlyphWord `blur`/`blurEnd`/`blurCurve` props; the
 * library defaults are used here.
 */
function GlyphMorphDemo({ now }) {
  const time = clockFormat(now); // "HH:MM:SS"

  return (
    <section className="demo demo--glyph">
      <div className="demo__container wide">
        <span className="demo__label">Character Morph</span>
        <GlyphWord
          className="demo__text"
          word={time}
          font={GLYPH_FONT}
          ease={{ stiffness: 180, damping: 22 }}
        />
      </div>
    </section>
  );
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
        <span className="demo__label">Cascade</span>
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
