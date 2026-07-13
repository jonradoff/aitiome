import { SiteHeader, SiteFooter, DECK_URL } from "../site";

// The Recursive Language Models page: the four evidence-synthesis methods we
// evaluated for Aitiome, each method's benefit, the head-to-head grid, and the
// conclusion. Numbers mirror docs/research/rlm/FINDINGS.md. This is an OFFLINE
// methods study — never on the live request path, never touching the recovery gate.

export type Method = { key: string; name: string; tone: string; what: string; benefit: string };
export const METHODS: Method[] = [
  { key: "RAG", name: "RAG", tone: "var(--ink-dim)",
    what: "A single web-grounded model call reads the sources and writes the answer.",
    benefit: "Simple and cheap. But it must hold the whole problem in one context, and one slow or failed retrieval sinks the entire pass." },
  { key: "RAG+", name: "RAG+", tone: "var(--signal)",
    what: "The single pass, hardened with a multi-query, counter-evidence-seeking prompt.",
    benefit: "A strong baseline: far more source breadth and disconfirming evidence than plain RAG, still at single-pass cost." },
  { key: "RLM-1", name: "RLM-1", tone: "var(--recovered)",
    what: "An Opus planner splits the task into ~6 bounded sub-investigations; parallel Sonnet leaves each research one; a deterministic merge combines them (depth-1).",
    benefit: "Decomposition buys coverage and graceful degradation — a stalled leaf loses only its sub-question, not the whole pass." },
  { key: "RLM-ADV", name: "RLM-ADV", tone: "var(--reject)",
    what: "RLM-1 plus a dedicated adversarial critic that actively hunts refutation.",
    benefit: "Surfaces dramatically more counter-evidence — the property a calibrated-honesty tool needs most." },
];

// mean per chemical over all six chemicals (24/24 cells complete).
// Source: docs/research/rlm/FINDINGS.md.
export const GRID: { label: string; vals: [string, string, string, string]; highlight?: number }[] = [
  { label: "evidence objects", vals: ["13.5", "17.2", "14.2", "17.7"], highlight: 3 },
  { label: "distinct sources", vals: ["8.2", "12.7", "8.8", "13.7"], highlight: 3 },
  { label: "counter-evidence found", vals: ["1.2", "5.7", "1.8", "12.7"], highlight: 3 },
  { label: "diagnostic recovered", vals: ["4/6", "4/6", "3/6", "0/6"] },
  { label: "cost (6 chemicals)", vals: ["$2.47", "$3.58", "$4.04", "$7.01"] },
];

export function RlmPage() {
  return (
    <div className="shell">
      <SiteHeader />
      <main>
        <section className="wrap" style={{ paddingTop: 40, paddingBottom: 20 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>A second question we studied</p>
          <h1 style={{ fontSize: "clamp(30px, 4.6vw, 50px)", letterSpacing: "-0.02em", lineHeight: 1.06, margin: 0, maxWidth: "20ch" }}>
            Beyond RAG — <span style={{ color: "var(--signal)" }}>Recursive Language Models</span>
          </h1>
          <p className="dim" style={{ fontSize: "clamp(15px, 1.7vw, 18px)", lineHeight: 1.55, maxWidth: "74ch", marginTop: 18 }}>
            Aitiome grades on a deterministic curated gate — but assembling the surrounding evidence is a
            reasoning task, and how a model does that assembly matters. We compared four evidence-synthesis
            methods on <b style={{ color: "var(--ink)" }}>one shared deterministic scorer</b> across six chemicals
            (three Parkinson's positives, two adversarial decoys, one open candidate). The question:
            which method best assembles source-grounded evidence <i>and then stress-tests it?</i>
          </p>
        </section>

        <section className="wrap section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="two-col">
            {METHODS.map((m) => (
              <div key={m.key} className="panel" style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: m.tone, flex: "none" }} />
                  <span className="mono" style={{ fontSize: 16, fontWeight: 600 }}>{m.name}</span>
                </div>
                <p className="dim" style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 10px" }}>{m.what}</p>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: 0, color: "var(--ink-dim)" }}>
                  <b style={{ color: "var(--ink)" }}>Benefit — </b>{m.benefit}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <p className="eyebrow" style={{ marginBottom: 12 }}>Four methods, one deterministic scorer, six chemicals</p>
          <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)", maxWidth: "26ch", marginBottom: 18 }}>
            What we found: RAG vs RAG+ vs RLM vs adversarial RLM
          </h2>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="rlm-grid rlm-head">
              <div className="mono faint">mean per chemical</div>
              {METHODS.map((m) => (
                <div key={m.key} className="mono" style={{ fontWeight: 600, color: m.tone }}>{m.name}</div>
              ))}
            </div>
            {GRID.map((row) => (
              <div className="rlm-grid" key={row.label}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{row.label}</div>
                {row.vals.map((v, i) => (
                  <div key={i} className="mono" style={{ fontSize: 15, color: row.highlight === i ? "var(--reject)" : "var(--ink-dim)", fontWeight: row.highlight === i ? 700 : 400 }}>{v}</div>
                ))}
              </div>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 12, maxWidth: "82ch" }}>
            RAG+ and RLM-ADV are the strong variant of each family. RLM numbers are a <b>floor</b>: a slow
            web-search window degraded ~2/3 of leaves and they still matched RAG+. All four systems are complete
            over the six chemicals (24/24 cells).
          </p>
        </section>

        <section className="wrap section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="two-col">
            <div className="panel" style={{ padding: "24px 26px", borderColor: "color-mix(in srgb, var(--recovered) 40%, transparent)" }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--recovered)", marginBottom: 12 }}>The finding</div>
              <p className="dim" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
                Adversarial RLM surfaced <b style={{ color: "var(--ink)" }}>~10× more counter-evidence than RAG and
                ~2.2× more than the strong RAG+ baseline</b>, matching RAG+ on yield and source breadth — while
                running degraded. For a tool built on calibrated honesty, actively hunting <i>disconfirming</i> evidence
                is the property that matters most.
              </p>
            </div>
            <div className="panel" style={{ padding: "24px 26px" }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--signal)", marginBottom: 12 }}>The trade-off, kept honest</div>
              <p className="dim" style={{ fontSize: 15, lineHeight: 1.55, margin: 0 }}>
                RLM-ADV's critic refutes rather than confirms — it recovered 0/6 diagnostic anchors — so it pairs
                with RLM-1, which builds the case. And decomposition <b style={{ color: "var(--ink)" }}>degrades
                gracefully</b>: a stalled leaf loses one sub-question, where a monolithic RAG call loses everything.
              </p>
            </div>
          </div>
          <p style={{ fontSize: "clamp(18px,2.2vw,24px)", color: "var(--signal)", lineHeight: 1.4, marginTop: 26, maxWidth: "60ch" }}>
            Conclusion: adversarial RLM is the right synthesis method for this life-science evidence-assembly
            use case — where finding the counter-evidence matters as much as building the case.
          </p>
        </section>

        <section className="wrap section">
          <div className="panel" style={{ padding: "20px 22px" }}>
            <div className="mono faint" style={{ fontSize: 11, marginBottom: 10 }}>METHOD &amp; PROVENANCE</div>
            <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
              Depth-1 Recursive Language Models — Zhang, Kraska &amp; Khattab, MIT CSAIL,{" "}
              <a href="https://arxiv.org/abs/2512.24601" target="_blank" rel="noreferrer" style={{ color: "var(--signal)" }}>arXiv:2512.24601</a>{" "}
              (2025). Depth fixed at 1 per the reproduction caution (Wang 2026): deeper recursion inflates cost
              without accuracy gains. This is an <b style={{ color: "var(--ink)" }}>offline experiment</b> — it never
              runs on the live request path and never touches the deterministic recovery gate. Full method and
              per-chemical data: <span className="mono">docs/research/rlm/FINDINGS.md</span>.
            </p>
          </div>
          <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn primary" href={DECK_URL} target="_blank" rel="noreferrer">View the presentation (PDF)</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
