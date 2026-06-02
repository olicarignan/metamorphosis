import { useEffect, useMemo, useRef, useState } from "react";
import { TextMorph } from "../../src/react";
import { spring } from "../../src/text-morph/utils/spring";
import { Slider } from "./Slider";
import { IconLink } from "./IconLink";

const WORDS = ["morph", "transform", "animate", "interpolate", "metamorphose"];
const NUMBERS = ["1,240", "15:04", "3.141592", "27°", "-15"];

const SPRING_WORDS = ["bounce", "spring", "wobble", "settle", "snap"];

// A few characterful spring presets to showcase the physics.
const PRESETS = [
  { name: "gentle", stiffness: 120, damping: 20 },
  { name: "bouncy", stiffness: 180, damping: 9 },
  { name: "wobbly", stiffness: 110, damping: 4 },
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
  const [numberIndex, setNumberIndex] = useState(0);

  const [text, setText] = useState("Type to morph");

  // Cycle the hero word on a timer.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
      setNumberIndex((i) => (i + 1) % NUMBERS.length);
    }, 1800);
    return () => clearInterval(id);
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
              <TextMorph className="demo__text">
                {NUMBERS[numberIndex]}
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
        </section>
        <section className="credits">
          <span>
            Made by{" "}
            <IconLink href="https://oliviercarignan.com">Olivier Carignan</IconLink>
          </span>
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
              duration <strong>{duration}ms</strong>
            </span>
            <span>
              ζ <strong>{zeta.toFixed(2)}</strong>
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
