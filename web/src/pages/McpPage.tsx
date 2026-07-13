import { SiteHeader, SiteFooter, GITHUB_URL } from "../site";

// In-app MCP documentation page. The canonical, always-current reference is
// mcp.md in the repo; this page is the styled in-product version so judges and
// agent authors can reach it without leaving the app. Tools mirror
// services/cmd/mcpd/main.go (13 read-only tools).

const MCP_MD_URL = GITHUB_URL + "/blob/master/mcp.md";

type Tool = { name: string; params: string; purpose: string };
const TOOLS: Tool[] = [
  { name: "health", params: "—", purpose: "Engine health, contract version, embedded compound count." },
  { name: "diseases", params: "—", purpose: "Disease axes (PD / AD) with each AOP anchor + endorsement status." },
  { name: "list_compounds", params: "disease?", purpose: "The curated validation set for a disease axis." },
  { name: "resolve_compound", params: "id", purpose: "Resolve name / CAS / DTXSID / InChIKey / CID → the salt-correct record." },
  { name: "assess_compound", params: "id, disease?", purpose: "Full assessment: resolve → curated gate → reconstructed AOP → trace + confidence." },
  { name: "run_validation", params: "disease?", purpose: "The full validation harness (positives + negatives incl. adversarial decoys)." },
  { name: "list_candidates", params: "disease?", purpose: "The evidence-weighted-priority candidate triage queue." },
  { name: "synthesize_assessment", params: "id", purpose: "Prose synthesis of a completed assessment (Claude, or deterministic fallback), [E#]-cited." },
  { name: "assess_curated", params: "input (JSON)", purpose: "Grade externally assembled curated evidence with the same deterministic gate." },
  { name: "sources", params: "—", purpose: "Primary data-source citations (CTD, AOP-Wiki, ToxCast, MitoCarta, FAERS, B3DB…)." },
  { name: "benchmark", params: "—", purpose: "Falsification harness: curated rule (fp=fn=0) vs bioactivity AUROC ≈ chance." },
  { name: "discovery_map", params: "—", purpose: "The honest negative-results discovery map (7 axes, coverage/confounder-killed)." },
  { name: "get_pathway", params: "aop?", purpose: "Reconstruct an endorsed OECD AOP as a positioned graph." },
];

const CONNECT = `{
  "mcpServers": {
    "aitiome": {
      "command": "/path/to/mcpd",
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}`;

const EXAMPLES: { title: string; call: string; result: string; note: string }[] = [
  {
    title: "assess_compound — rotenone (Parkinson's)",
    call: `assess_compound({ "id": "rotenone", "disease": "pd" })`,
    result: `{
  "compound": { "name": "rotenone", "dtxsid": "DTXSID6021248" },
  "recovery": {
    "call": "positive",
    "predicate": { "ctdPdDirectEvidence": true, "neuroAopStressor": true },
    "rationale": "Curated CTD Parkinson's DirectEvidence AND a registered AOP-3 stressor."
  },
  "confidenceTier": "assay_mechanism_recovered",
  "corroboration": { "mitoActive": 3, "note": "bioactivity is corroboration only — never the decision" }
}`,
    note: "The gate fires on curated evidence; bioactivity is reported but never decides.",
  },
  {
    title: "list_candidates — the triage queue (PD)",
    call: `list_candidates({ "disease": "pd" })`,
    result: `{
  "candidates": [
    { "name": "fenpyroximate", "priority": 7.0, "distanceToGate": "registered AOP-3 stressor — gate-ready",
      "nextExperiment": "Confirm CTD-PD DirectEvidence" },
    { "name": "perchloroethylene", "priority": 5.5, "distanceToGate": "CTD batch API ALTCHA-walled",
      "nextExperiment": "Manual CTD-PD DirectEvidence verification" }
  ],
  "controls": { "adversarialDecoys": "carried permanently, ranked last (score 0)" }
}`,
    note: "Transparent additive ranking on non-bioactivity strands. Decoys must rank last; a held-out backtest recovers a known positive (TCE/DDE) from non-curated evidence alone.",
  },
  {
    title: "benchmark — the falsification",
    call: `benchmark({})`,
    result: `{
  "curatedRule": { "falsePositives": 0, "falseNegatives": 0 },
  "bioactivity": { "mitoAUROC": 0.16, "mechanisticAUROC": 0.39, "verdict": "at or below chance vs adversarial decoys" }
}`,
    note: "The core result: curated mechanism discriminates perfectly; bioactivity is anti-diagnostic here.",
  },
];

export function McpPage() {
  return (
    <div className="shell">
      <SiteHeader />
      <main>
        <section className="wrap" style={{ paddingTop: 40, paddingBottom: 20 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>One engine, usable by humans and agents</p>
          <h1 style={{ fontSize: "clamp(30px, 4.6vw, 50px)", letterSpacing: "-0.02em", lineHeight: 1.06, margin: 0, maxWidth: "22ch" }}>
            The <span style={{ color: "var(--signal)" }}>MCP</span> interface
          </h1>
          <p className="dim" style={{ fontSize: "clamp(15px, 1.7vw, 18px)", lineHeight: 1.55, maxWidth: "74ch", marginTop: 18 }}>
            Aitiome ships a Model Context Protocol server as a sibling adapter over the exact same engine
            the web app uses — so an external agent can drive it. All <b style={{ color: "var(--ink)" }}>13 tools
            are read-only</b>; the recovery decision is a deterministic curated gate (never bioactivity, never an
            LLM in the decision path), and every result is graded and cited.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn primary" href={MCP_MD_URL} target="_blank" rel="noreferrer">Full reference — mcp.md ↗</a>
          </div>
        </section>

        <section className="wrap section">
          <h2 style={{ fontSize: "clamp(20px,2.4vw,26px)", marginBottom: 14 }}>Connecting</h2>
          <p className="dim" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: "74ch", marginBottom: 14 }}>
            Build the server from <span className="mono">services/cmd/mcpd</span> (<span className="mono">go build -o mcpd ./services/cmd/mcpd</span>);
            it speaks MCP over stdio. Point any MCP client at the binary. Only <span className="mono">synthesize_assessment</span> uses
            <span className="mono"> ANTHROPIC_API_KEY</span> — every other tool works keyless (deterministic).
          </p>
          <pre className="panel mono" style={{ padding: "16px 18px", fontSize: 12.5, overflowX: "auto", lineHeight: 1.5 }}>{CONNECT}</pre>
        </section>

        <section className="wrap section">
          <h2 style={{ fontSize: "clamp(20px,2.4vw,26px)", marginBottom: 16 }}>Tools</h2>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="mcp-row mcp-head">
              <div className="mono faint">tool</div>
              <div className="mono faint">params</div>
              <div className="mono faint">purpose</div>
            </div>
            {TOOLS.map((t) => (
              <div className="mcp-row" key={t.name}>
                <div className="mono" style={{ fontSize: 13.5, color: "var(--signal)" }}>{t.name}</div>
                <div className="mono faint" style={{ fontSize: 12.5 }}>{t.params}</div>
                <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.4 }}>{t.purpose}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <h2 style={{ fontSize: "clamp(20px,2.4vw,26px)", marginBottom: 16 }}>Three worked examples</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {EXAMPLES.map((ex) => (
              <div key={ex.title} className="panel" style={{ padding: "20px 22px" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>{ex.title}</div>
                <pre className="mono" style={{ fontSize: 12.5, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", overflowX: "auto", margin: "0 0 10px" }}>{ex.call}</pre>
                <pre className="mono" style={{ fontSize: 12, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: "var(--radius-sm)", padding: "10px 12px", overflowX: "auto", margin: 0, lineHeight: 1.5, color: "var(--ink-dim)" }}>{ex.result}</pre>
                <p className="faint" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 10, marginBottom: 0 }}>{ex.note}</p>
              </div>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 14 }}>
            Result payloads are illustrative — the engine computes them live from embedded curated data. See the
            full reference in <a href={MCP_MD_URL} target="_blank" rel="noreferrer" style={{ color: "var(--signal)" }}>mcp.md</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
