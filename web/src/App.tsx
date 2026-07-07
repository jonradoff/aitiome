import { useState } from "react";
import { getValidation, getHealth, getPathway, assess } from "./data";
import { useAsync } from "./useAsync";
import { Hero } from "./hero/Hero";

const KNOWN = ["rotenone", "paraquat", "MPTP", "chlorpyrifos", "6-hydroxydopamine"];
const DECOYS = ["simvastatin", "troglitazone", "warfarin", "fenofibrate"];

export function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeId, setActiveId] = useState("rotenone");

  const health = useAsync(getHealth, []);
  const validation = useAsync(getValidation, []);
  const pathway = useAsync(getPathway, []);
  const active = useAsync(() => assess(activeId), [activeId]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const source = validation?.source ?? "fixture";
  const s = validation?.data.summary;
  const result = active?.data ?? null;

  return (
    <div className="shell">
      <Masthead live={!!health?.health} onToggle={toggleTheme} theme={theme} />

      <main>
        <section className="wrap" style={{ paddingTop: 40, paddingBottom: 30 }}>
          <div style={{ maxWidth: 720 }}>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Validation, not a watchlist</p>
            <h1 style={{ fontSize: "clamp(28px, 3.8vw, 46px)" }}>
              It reconstructs the endorsed mechanism, recovers the known
              neurotoxicants, and is not fooled by the imposters.
            </h1>
          </div>

          <div style={{ marginTop: 26 }}>
            <Selector activeId={activeId} onSelect={setActiveId} />
          </div>

          {pathway && (
            <div style={{ marginTop: 18 }}>
              <Hero pathway={pathway.data} result={result} height={470} />
            </div>
          )}

          {result && (
            <div style={{ marginTop: 18 }}>
              <Readout result={result} />
            </div>
          )}
        </section>

        <section className="wrap section">
          <p className="dim" style={{ fontSize: 16, maxWidth: "64ch", marginBottom: 26 }}>
            Aitiome grades a chemical on curated mechanism, never on bioactivity. On the
            reconnaissance ground truth it recovers all twelve known neurotoxicants and
            rejects all fifteen negatives, including six bioactive, mitochondria-active
            decoys built to fool an activity-based model.
          </p>
          {s && (
            <Scoreboard
              recovered={`${s.positivesRecovered}/${s.positivesTotal}`}
              rejected={`${s.negativesRejected}/${s.negativesTotal}`}
              decoys={`${s.adversarialRejected}/${s.adversarialTotal}`}
              errors={s.falsePositives + s.falseNegatives}
            />
          )}
        </section>
      </main>

      <Footer source={source} />
    </div>
  );
}

function Selector(props: { activeId: string; onSelect: (id: string) => void }) {
  const Group = ({ title, ids, tone }: { title: string; ids: string[]; tone: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span className="mono faint" style={{ fontSize: 11.5, letterSpacing: "0.04em", width: 150 }}>{title}</span>
      {ids.map((id) => {
        const on = props.activeId.toLowerCase() === id.toLowerCase();
        return (
          <button
            key={id}
            onClick={() => props.onSelect(id)}
            className="btn"
            style={{
              padding: "7px 13px", fontSize: 13,
              borderColor: on ? tone : "var(--line-2)",
              background: on ? `color-mix(in srgb, ${tone} 15%, var(--bg-3))` : "var(--bg-3)",
            }}
          >
            {id}
          </button>
        );
      })}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Group title="known neurotoxicants" ids={KNOWN} tone="var(--recovered)" />
      <Group title="bioactive decoys" ids={DECOYS} tone="var(--reject)" />
    </div>
  );
}

function Readout({ result }: { result: import("@contract").CompoundResult }) {
  const positive = result.recovery.call === "positive";
  const tone = positive ? "var(--recovered)" : "var(--reject)";
  return (
    <div className="panel" style={{ padding: "18px 20px", display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 18 }}>{result.compound.name}</span>
          <span className={`chip ${positive ? "recovered" : "reject"}`}>
            <span className="dot" />{positive ? "recovered" : "not flagged"}
          </span>
        </div>
        <div className="mono faint" style={{ fontSize: 11.5, marginTop: 6 }}>
          {result.compound.dtxsid} / tier: {result.confidenceTier}
        </div>
      </div>
      <p className="dim" style={{ fontSize: 14, flex: 1, minWidth: 280, margin: 0, color: tone, opacity: 0.95 }}>
        {result.recovery.rationale}
      </p>
    </div>
  );
}

function Masthead(props: { live: boolean; theme: "dark" | "light"; onToggle: () => void }) {
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
        <span className="mono faint" style={{ fontSize: 12 }}>exposome / neurodegeneration</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className={`chip ${props.live ? "recovered" : "signal"}`}>
          <span className="dot" />{props.live ? "engine live" : "fixtures"}
        </span>
        <button className="btn" onClick={props.onToggle}>{props.theme === "dark" ? "Light" : "Dark"}</button>
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
    <div className="panel" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: 0, overflow: "hidden" }}>
      {items.map((it, i) => (
        <div key={it.lab} className="stat" style={{ padding: "26px 24px", borderLeft: i ? "1px solid var(--line)" : "none" }}>
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
        <span className="faint mono" style={{ fontSize: 12 }}>Evidence-ranked mechanistic hypotheses. Never claims of causation.</span>
        <span className="faint mono" style={{ fontSize: 12 }}>data source: {props.source} / contract v1.0.0</span>
      </div>
    </footer>
  );
}
