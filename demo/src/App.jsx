import { useEffect, useMemo, useState } from "react";
import { TextMorph } from "../../src/react";
import { spring } from "../../src/text-morph/utils/spring";

const WORDS = ["morph", "transform", "animate", "interpolate", "metamorphose"];

const SPRING_WORDS = ["bounce", "spring", "wobble", "settle", "snap"];

// A few characterful spring presets to showcase the physics.
const PRESETS = [
  { name: "gentle", stiffness: 120, damping: 20 },
  { name: "bouncy", stiffness: 180, damping: 9 },
  { name: "wobbly", stiffness: 110, damping: 4 },
  { name: "stiff", stiffness: 320, damping: 26 },
];

export default function App() {
  const [wordIndex, setWordIndex] = useState(0);
  const [count, setCount] = useState(1240);
  const [text, setText] = useState("type to morph me");

  // Cycle the hero word on a timer.
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="page__header">
          <h1>metamorphosis</h1>
          <p>Text that morphs character-by-character between values.</p>
        </header>

        {/* A single word that cycles on a timer */}
        <section className="demo">
          <span className="demo__label">cycling words</span>
          <TextMorph className="demo__hero">{WORDS[wordIndex]}</TextMorph>
        </section>

        {/* Numbers re-morph as digits change */}
        <section className="demo">
          <span className="demo__label">numbers</span>
          <TextMorph className="demo__number">
            {count.toLocaleString("en-US")}
          </TextMorph>
          <div className="demo__controls">
            <button onClick={() => setCount((c) => c - 137)}>−137</button>
            <button onClick={() => setCount((c) => c + 137)}>+137</button>
            <button onClick={() => setCount(Math.floor(Math.random() * 99999))}>
              random
            </button>
          </div>
        </section>

        {/* Spring presets — same word, different physics */}
        <SpringPresets />

        {/* Live stiffness / damping playground */}
        <SpringPlayground />

        {/* Morphs live as you type */}
        <section className="demo">
          <span className="demo__label">free text</span>
          <TextMorph className="demo__text">{text || " "}</TextMorph>
          <input
            className="demo__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type to morph…"
          />
        </section>

        <section className="page__install">
          <h2>Use it in your project</h2>
          <p>Install the package:</p>
          <pre>
            <code>pnpm add github:olicarignan/text-morph</code>
          </pre>
          <p>Then render any text or number through it:</p>
          <pre>
            <code>{`import { TextMorph } from "metamorphosis/react";

<TextMorph>{value}</TextMorph>;`}</code>
          </pre>
          <p>
            Tune it with <code>duration</code>, <code>ease</code> (a CSS easing
            string or a spring config), <code>scale</code>, <code>locale</code>,
            and <code>onAnimationComplete</code>. See <code>README.md</code> for
            the full prop list.
          </p>
        </section>
      </div>
    </main>
  );
}

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
      <span className="demo__label">spring presets</span>
      <TextMorph
        className="demo__hero"
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
      setWordIndex((i) => (i + 1) % SPRING_WORDS.length);
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
  const behavior =
    zeta < 1 ? "underdamped — overshoots & bounces" : "critically/over-damped — settles smoothly";

  return (
    <section className="demo">
      <span className="demo__label">spring playground</span>
      <TextMorph className="demo__hero" ease={{ stiffness, damping }}>
        {SPRING_WORDS[wordIndex]}
      </TextMorph>

      <div className="playground">
        <label className="playground__row">
          <span className="playground__name">stiffness</span>
          <input
            type="range"
            min={20}
            max={400}
            step={5}
            value={stiffness}
            onChange={(e) => setStiffness(Number(e.target.value))}
          />
          <span className="playground__value">{stiffness}</span>
        </label>

        <label className="playground__row">
          <span className="playground__name">damping</span>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={damping}
            onChange={(e) => setDamping(Number(e.target.value))}
          />
          <span className="playground__value">{damping}</span>
        </label>

        <div className="playground__readout">
          <span>
            duration <strong>{duration}ms</strong>
          </span>
          <span>
            ζ <strong>{zeta.toFixed(2)}</strong>
          </span>
          <span className="playground__behavior">{behavior}</span>
        </div>
      </div>
    </section>
  );
}
