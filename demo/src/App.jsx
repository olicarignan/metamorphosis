import { useEffect, useState } from "react";
import { TextMorph } from "../../src/react";

const WORDS = ["morph", "transform", "animate", "interpolate", "metamorphose"];

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
          <h1>text-morph</h1>
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

        {/* Morphs live as you type */}
        <section className="demo">
          <span className="demo__label">free text</span>
          <TextMorph className="demo__text">{text || " "}</TextMorph>
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
            <code>{`import { TextMorph } from "text-morph/react";

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
