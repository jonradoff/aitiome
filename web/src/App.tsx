import { useState } from "react";
import { getValidation, getHealth } from "./data";
import { useAsync } from "./useAsync";

export function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const health = useAsync(getHealth, []);
  const validation = useAsync(getValidation, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const source = validation?.source ?? "fixture";
  const s = validation?.data.summary;

  return (
    <div className="shell">
      <Masthead source={source} live={!!health?.health} onToggle={toggleTheme} theme={theme} />

      <main>
        <section className="wrap section" style={{ borderTop: "none", paddingTop: 40 }}>
          <div style={{ maxWidth: 760 }}>
            <p className="eyebrow" style={{ marginBottom: 18 }}>Validation, not a watchlist</p>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 52px)" }}>
              It reconstructs the endorsed mechanism, recovers the known
              neurotoxicants, and is not fooled by the imposters.
            </h1>
            <p className="dim" style={{ fontSize: 17, marginTop: 20, maxWidth: "62ch" }}>
              Aitiome grades a chemical on curated mechanism, never on bioactivity. On the
              reconnaissance ground truth it recovers all twelve known neurotoxicants and
              rejects all fifteen negatives, including six bioactive, mitochondria-active
              decoys built to fool an activity-based model.
            </p>
          </div>

          {s && (
            <div style={{ marginTop: 40 }}>
              <Scoreboard
                recovered={`${s.positivesRecovered}/${s.positivesTotal}`}
                rejected={`${s.negativesRejected}/${s.negativesTotal}`}
                decoys={`${s.adversarialRejected}/${s.adversarialTotal}`}
                errors={s.falsePositives + s.falseNegatives}
              />
            </div>
          )}
        </section>
      </main>

      <Footer source={source} />
    </div>
  );
}

function Masthead(props: {
  source: "live" | "fixture";
  live: boolean;
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  return (
    <header
      className="wrap"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 68, position: "sticky", top: 0, zIndex: 20,
        backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 72%, transparent)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 18 }}>Aitiome</span>
        <span className="mono faint" style={{ fontSize: 12 }}>
          exposome / neurodegeneration
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className={`chip ${props.live ? "recovered" : "signal"}`}>
          <span className="dot" />
          {props.live ? "engine live" : "fixtures"}
        </span>
        <button className="btn" onClick={props.onToggle} aria-label="Toggle theme">
          {props.theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}

function Scoreboard(props: { recovered: string; rejected: string; decoys: string; errors: number }) {
  const items = [
    { num: props.recovered, lab: "known neurotoxicants recovered", tone: "var(--recovered)" },
    { num: props.rejected, lab: "negatives correctly rejected", tone: "var(--ink)" },
    { num: props.decoys, lab: "bioactive decoys not fooled", tone: "var(--reject)" },
    { num: String(props.errors), lab: "false positives + false negatives", tone: "var(--signal)" },
  ];
  return (
    <div
      className="panel"
      style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        padding: 0, overflow: "hidden",
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.lab}
          className="stat"
          style={{ padding: "26px 24px", borderLeft: i ? "1px solid var(--line)" : "none" }}
        >
          <span className="num" style={{ color: it.tone }}>{it.num}</span>
          <span className="lab">{it.lab}</span>
        </div>
      ))}
    </div>
  );
}

function Footer(props: { source: "live" | "fixture" }) {
  return (
    <footer className="wrap section" style={{ paddingBottom: 44 }}>
      <div className="hair" style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span className="faint mono" style={{ fontSize: 12 }}>
          Evidence-ranked mechanistic hypotheses. Never claims of causation.
        </span>
        <span className="faint mono" style={{ fontSize: 12 }}>
          data source: {props.source} / contract v1.0.0
        </span>
      </div>
    </footer>
  );
}
