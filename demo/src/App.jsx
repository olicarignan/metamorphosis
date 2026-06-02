import { useEffect, useMemo, useRef, useState } from "react";
import { TextMorph } from "../../src/react";
import { spring } from "../../src/text-morph/utils/spring";
import { Slider } from "./Slider";
import { IconLink } from "./IconLink";

const WORDS = [
  "transform",
  "animate",
  "mutate",
  "metamorphose",
  "shift",
  "permute",
];
const SPRING_WORDS = ["bounce", "spring", "wobble", "settle", "snap"];

// Live clock — formats we rotate through while it ticks each second.
const CLOCK_FORMATS = [
  // Jun 2 2026
  (d) =>
    d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .replace(",", ""),
  // 10:38:02
  (d) => d.toLocaleTimeString("en-GB", { hour12: false }),
  // Jun 2 10:38 AM
  (d) => {
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} ${time}`;
  },
];

// A few characterful spring presets to showcase the physics.
const PRESETS = [
  { name: "gentle", stiffness: 120, damping: 20 },
  { name: "bouncy", stiffness: 180, damping: 16 },
  { name: "stiff", stiffness: 320, damping: 26 },
];

// Install command per package manager — the morph target for the install tabs.
const INSTALL = [
  { id: "pnpm", cmd: "pnpm i github:olicarignan/metamorphosis" },
  { id: "npm", cmd: "npm i github:olicarignan/metamorphosis" },
  { id: "bun", cmd: "bun i github:olicarignan/metamorphosis" },
  { id: "yarn", cmd: "yarn add github:olicarignan/metamorphosis" },
];

export default function App() {
  const [wordIndex, setWordIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [clockFormat, setClockFormat] = useState(0);

  const [text, setText] = useState("Type to morph");

  // Cycle the hero word on a timer.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  // Tick the live clock every second, and rotate its format less often.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    const fmt = setInterval(
      () => setClockFormat((i) => (i + 1) % CLOCK_FORMATS.length),
      4000,
    );
    return () => {
      clearInterval(tick);
      clearInterval(fmt);
    };
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="page__header">
          <h1>Metamorphosis</h1>
          <p>Animated text that morphs between values.</p>
        </header>

        <div className="demo-grid">
          <section className="demo">
            <div className="demo__container">
              <TextMorph className="demo__text">{WORDS[wordIndex]}</TextMorph>
            </div>
          </section>
          <section className="demo">
            <div className="demo__container">
              <TextMorph className="demo__text" granularity="grapheme">
                {CLOCK_FORMATS[clockFormat](now)}
              </TextMorph>
            </div>
          </section>
        </div>

        <div className="demo-grid">
          {/* Spring presets — same word, different physics */}
          <SpringPresets />
        </div>

        <div className="demo-grid">
          {/* Live stiffness / damping playground */}
          <SpringPlayground />
        </div>

        <div className="demo-grid">
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
        </div>

        <section className="page__install">
          <h2>Install</h2>
          <InstallTabs />
          <h3>Usage</h3>
          <pre>
            <code>{`import { TextMorph } from "metamorphosis/react";

<TextMorph>{value}</TextMorph>;`}</code>
          </pre>
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
        </section>
        <section className="credits">
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
 * Install snippet with package-manager tabs. The command is wrapped in a
 * TextMorph so switching tabs morphs one command into the next, and a copy
 * button morphs from a copy icon to a checkmark once the command is copied.
 */
function InstallTabs() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL[active].cmd);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
            onClick={() => {
              setActive(i);
              setCopied(false);
            }}
          >
            {m.id}
          </button>
        ))}
      </div>

      <div className="install__command">
        <div className="install__scroll">
          <TextMorph className="install__code" granularity="grapheme">
            {INSTALL[active].cmd}
          </TextMorph>
        </div>

        <button
          type="button"
          className={`install__copy${copied ? " is-copied" : ""}`}
          onClick={copyCommand}
          aria-label={copied ? "Copied" : "Copy install command"}
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
      </div>
    </div>
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

/**
 * Showcases the same word morphing under different spring presets. Pass a
 * `{ stiffness, damping }` object straight to the `ease` prop and metamorphosis
 * derives a `linear()` easing + duration from the spring physics.
 */
function SpringPresets() {
  const [active, setActive] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);

  const preset = PRESETS[active];

  // Auto-advance the word so the spring is always being demonstrated.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % SPRING_WORDS.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="demo">
      <div className="demo__container wide">
        <TextMorph
          className="demo__text"
          ease={{ stiffness: preset.stiffness, damping: preset.damping }}
        >
          {SPRING_WORDS[wordIndex]}
        </TextMorph>
        <div className="demo__controls">
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              className={i === active ? "is-active" : undefined}
              onClick={() => {
                setActive(i);
                setWordIndex((w) => (w + 1) % SPRING_WORDS.length);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Live playground: drag stiffness / damping and watch the morph respond in
 * real time. The spring config is passed straight through the `ease` prop.
 */
function SpringPlayground() {
  const [stiffness, setStiffness] = useState(180);
  const [damping, setDamping] = useState(12);
  const [wordIndex, setWordIndex] = useState(0);

  // Cycle words continuously so the current spring is always on display.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // Derive the same easing/duration metamorphosis will use, for the readout.
  const { duration } = useMemo(
    () => spring({ stiffness, damping }),
    [stiffness, damping],
  );

  // Damping ratio — < 1 oscillates (bouncy), >= 1 settles without overshoot.
  const zeta = damping / (2 * Math.sqrt(stiffness));

  return (
    <section className="demo">
      <div className="demo__container wide">
        <TextMorph className="demo__text" ease={{ stiffness, damping }}>
          {WORDS[wordIndex]}
        </TextMorph>

        <div className="dialkit-root demo__panel" data-theme="light">
          <div className="playground__readout">
            <span>
              duration{" "}
              <span className="playground__readout-value">{duration}ms</span>
            </span>
            <span>
              ζ{" "}
              <span className="playground__readout-value">
                {zeta.toFixed(2)}
              </span>
            </span>
          </div>

          <div className="demo__dials">
            <Slider
              label="Stiffness"
              value={stiffness}
              min={20}
              max={400}
              step={5}
              onChange={setStiffness}
            />
            <Slider
              label="Damping"
              value={damping}
              min={2}
              max={40}
              step={1}
              onChange={setDamping}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
