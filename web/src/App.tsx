import { useState } from "react";
import { getValidation, getHealth, getPathway, getDiscoveryMap, assess, synthesize, resolveCompound } from "./data";
import { useAsync } from "./useAsync";
import { Hero } from "./hero/Hero";
import { EvidencePanel, TracePanel, ValidationPanel, DiscoveryPanel, MCPPanel, SynthesisPanel, ProvenanceDrawer } from "./components/Panels";
import type { EvidenceStrand } from "@contract";

const KNOWN = ["rotenone", "paraquat", "MPTP", "chlorpyrifos", "6-hydroxydopamine"];
const DECOYS = ["simvastatin", "troglitazone", "warfarin", "fenofibrate"];

export function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeId, setActiveId] = useState("rotenone");
  const [provenance, setProvenance] = useState<EvidenceStrand | null>(null);

  const health = useAsync(getHealth, []);
  const validation = useAsync(getValidation, []);
  const pathway = useAsync(getPathway, []);
  const discovery = useAsync(getDiscoveryMap, []);
  const active = useAsync(() => assess(activeId), [activeId]);
  const synthesis = useAsync(() => synthesize(activeId), [activeId]);

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
            <SearchBox onResolve={setActiveId} />
          </div>

          <div style={{ marginTop: 18 }}>
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

          {synthesis?.data && (
            <div style={{ marginTop: 18 }}>
              <SynthesisPanel syn={synthesis.data} />
            </div>
          )}

          {result && (
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16 }} className="two-col">
              <EvidencePanel result={result} onOpenProvenance={setProvenance} />
              <TracePanel result={result} />
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
          {validation && (
            <div style={{ marginTop: 26 }}>
              <ValidationPanel data={validation.data} activeId={activeId} onSelect={setActiveId} />
            </div>
          )}
        </section>

        {discovery && (
          <section className="wrap section">
            <DiscoveryPanel map={discovery.data} />
          </section>
        )}

        <section className="wrap section">
          <MCPPanel example={result} />
        </section>
      </main>

      <Footer source={source} />
      <ProvenanceDrawer strand={provenance} onClose={() => setProvenance(null)} />
    </div>
  );
}

function SearchBox(props: { onResolve: (name: string) => void }) {
  const [q, setQ] = useState("");
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);

  async function run() {
    const id = q.trim();
    if (!id) return;
    const c = await resolveCompound(id);
    if (c) {
      props.onResolve(c.name);
      const salt = c.toxcastCas && c.toxcastCas !== c.cas ? ` / tested as CAS ${c.toxcastCas}` : "";
      setNote({ text: `resolved to ${c.name} (${c.dtxsid})${salt}`, ok: true });
    } else {
      setNote({ text: `"${id}" is not in the validation set (the honest scope is the 27-compound ground truth)`, ok: false });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Resolve a chemical: name, CAS, DTXSID, or InChIKey"
          aria-label="Resolve a chemical"
          className="mono"
          style={{
            flex: 1, padding: "11px 14px", fontSize: 13.5,
            background: "var(--bg-2)", color: "var(--ink)",
            border: "1px solid var(--line-2)", borderRadius: "var(--radius-sm)", outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--signal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line-2)")}
        />
        <button className="btn primary" onClick={run}>Resolve</button>
      </div>
      {note && (
        <span className="mono" style={{ fontSize: 11.5, color: note.ok ? "var(--recovered)" : "var(--ink-faint)" }}>
          {note.text}
        </span>
      )}
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
