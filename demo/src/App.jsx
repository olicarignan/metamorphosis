import { useEffect, useMemo, useRef, useState } from "react";
import { TextMorph } from "../../src/react";
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

// Install command per package manager — the morph target for the install tabs.
const INSTALL = [
  { id: "pnpm", cmd: "pnpm i github:olicarignan/metamorphosis" },
  { id: "npm", cmd: "npm i github:olicarignan/metamorphosis" },
  { id: "bun", cmd: "bun i github:olicarignan/metamorphosis" },
  { id: "yarn", cmd: "yarn add github:olicarignan/metamorphosis" },
];

// Usage snippet — shared by the rendered code block and its copy button.
const USAGE_CODE = `import { TextMorph } from "metamorphosis/react";

<TextMorph>{value}</TextMorph>;`;

export default function App() {
  const [wordIndex, setWordIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const [text, setText] = useState("Type to morph");

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
            A dependency-free text animation library
          </p>
        </header>

        <div className="demos">
          <section className="demo">
            <div className="demo__container wide">
              <span className="demo__label">Morph</span>
              <TextMorph className="demo__text">{WORDS[wordIndex]}</TextMorph>
            </div>
          </section>
          <section className="demo">
            <div className="demo__container wide">
              <span className="demo__label">Cascade</span>
              <TextMorph className="demo__text" {...cascadeProps()}>
                {clockFormat(now)}
              </TextMorph>
            </div>
          </section>

          {/* Day stepper — step through calendar days, morphing the label */}
          <CalendarStepper />

          {/* Morphs live as you type */}
          <section className="demo">
            <div className="demo__container wide">
              <TextMorph className="demo__text" granularity="grapheme">
                {text || " "}
              </TextMorph>

              <div className="dialkit-root demo__dock" data-theme="light">
                <input
                  className="dialkit-text-field"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type to morph…"
                  aria-label="Text to morph"
                />
              </div>
            </div>
          </section>

          {/* Install / usage — sits inside the wireframe grid as a final row */}
          <section className="page__install">
            <h2>Install</h2>
            <InstallTabs />
            <h3>Usage</h3>
            <div className="usage">
              <pre>
                <code>{USAGE_CODE}</code>
              </pre>
              <CopyButton
                className="install__copy--corner"
                text={USAGE_CODE}
                label="Copy usage code"
              />
            </div>
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
 * Install snippet with package-manager tabs. The command is wrapped in a
 * TextMorph so switching tabs morphs one command into the next, and a copy
 * button morphs from a copy icon to a checkmark once the command is copied.
 */
function InstallTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="install">
      <div
        className="install__tabs"
        role="tablist"
        aria-label="Package manager"
      >
        {INSTALL.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? "is-active" : undefined}
            onClick={() => setActive(i)}
          >
            <span className="install__tab-label">{m.id}</span>
          </button>
        ))}
      </div>

      <div className="install__command">
        <div className="install__scroll">
          <TextMorph className="install__code" granularity="grapheme">
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

const GitHubIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

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
    <section className="demo">
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
