import type {
  CompoundResult,
  EvidenceStrand,
  ValidationResult,
  DiscoveryMap,
  DiscoveryAxis,
  Synthesis,
} from "@contract";

const STRAND_LABEL: Record<string, string> = {
  curated_mechanism: "Curated mechanism",
  assay_corroboration: "Assay corroboration",
  mito_celltype_grounding: "Mechanistic + cell-type grounding",
  faers: "Pharmacovigilance (FAERS)",
  epidemiology: "Human epidemiology",
  bbb: "Brain exposure (BBB)",
};

function statusTone(status: string): string {
  switch (status) {
    case "supports": return "var(--recovered)";
    case "refutes": return "var(--reject)";
    case "absent": return "var(--uncertain)";
    default: return "var(--ink-faint)";
  }
}

function SectionHead({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {kicker && <p className="eyebrow" style={{ marginBottom: 12 }}>{kicker}</p>}
      <h2 style={{ fontSize: 26 }}>{title}</h2>
    </div>
  );
}

// ---- Convergent evidence (per active compound) ----
export function EvidencePanel({ result }: { result: CompoundResult }) {
  const positive = result.recovery.call === "positive";
  const strands = result.strands ?? [];
  const rej = result.rejection;
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Convergent evidence</span>
        {!positive && rej && (
          <span className="chip reject"><span className="dot" />rejected on {rej.count} independent line{rej.count === 1 ? "" : "s"}</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {strands.map((st: EvidenceStrand, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, padding: "13px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: statusTone(st.status), flex: "0 0 auto" }} />
              <span style={{ fontSize: 14 }}>{STRAND_LABEL[st.kind] ?? st.kind}</span>
            </div>
            <div>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.04em", color: statusTone(st.status), textTransform: "uppercase" }}>{st.status.replace("_", " ")}</span>
              <p className="dim" style={{ fontSize: 13.5, margin: "4px 0 0" }}>{st.detail}</p>
              <p className="faint mono" style={{ fontSize: 10.5, marginTop: 4 }}>{st.source}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
        Strands ground and calibrate confidence. They never gate the recovery call, which rests on
        curated mechanism alone. Assay activity is shown because it is present, not because it decides.
      </p>
    </div>
  );
}

// ---- Reasoning synthesis (Claude evidence-reasoner) ----
export function SynthesisPanel({ syn }: { syn: Synthesis }) {
  const claude = syn.source === "claude";
  // split the prose so [E#] markers can be tied to the citation legend
  const parts = syn.prose.split(/(\[E\d+\])/g);
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Reasoning synthesis</span>
        <span className={`chip ${claude ? "signal" : ""}`}>
          <span className="dot" />
          {claude ? `Claude / ${syn.model}` : "deterministic"}
        </span>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.62, margin: 0, color: "var(--ink)" }}>
        {parts.map((p, i) =>
          /^\[E\d+\]$/.test(p) ? (
            <sup key={i} className="mono" style={{ color: "var(--signal)", fontSize: 10.5, padding: "0 1px" }}>{p}</sup>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {syn.citations.map((c) => (
          <span key={c.marker} className="chip" title={`${c.detail} (${c.source})`}>
            <span className="mono" style={{ color: "var(--signal)" }}>{c.marker}</span>
            {STRAND_LABEL[c.kind] ?? c.kind}
          </span>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        The synthesis explains the reasoning. It never makes or changes the recovery call, which is
        curated and fixed. Evidence is cited by marker; nothing is invented.
      </p>
    </div>
  );
}

// ---- Reasoning trace (per active compound) ----
const KIND_TAG: Record<string, string> = {
  resolve: "resolve",
  predicate_eval: "predicate",
  node_enter: "cascade",
  edge_fire: "cascade",
  ao_resolve: "terminal",
  strand: "evidence",
  reject_line: "reject",
  verdict: "verdict",
};

export function TracePanel({ result }: { result: CompoundResult }) {
  const trace = result.trace ?? [];
  return (
    <div className="panel" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
      <span style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Reasoning trace</span>
      <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, paddingRight: 6 }}>
        {trace.map((t, i) => {
          const tag = KIND_TAG[t.kind] ?? t.kind;
          const tone =
            t.kind === "verdict" ? (t.call === "positive" ? "var(--recovered)" : "var(--reject)")
            : t.kind === "reject_line" ? "var(--reject)"
            : t.kind === "ao_resolve" ? "var(--neuron)"
            : t.kind === "predicate_eval" ? (t.hit ? "var(--recovered)" : "var(--ink-faint)")
            : "var(--signal)";
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "78px 1fr", gap: 10, alignItems: "baseline", padding: "3px 0" }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: tone, textTransform: "uppercase" }}>{tag}</span>
              <span className="dim" style={{ fontSize: 12.5 }}>
                {t.label}
                {t.kind === "predicate_eval" && <span className="mono" style={{ color: tone }}> {t.hit ? " hit" : " miss"}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Full 27-compound validation panel (the trust proof) ----
export function ValidationPanel({ data, activeId, onSelect }: { data: ValidationResult; activeId: string; onSelect: (id: string) => void }) {
  const pos = data.perCompound.filter((c) => c.role === "positive");
  const neg = data.perCompound.filter((c) => c.role === "negative");
  const Cell = (c: CompoundResult) => {
    const positive = c.recovery.call === "positive";
    const on = activeId.toLowerCase() === c.compound.name.toLowerCase();
    const adversarial = c.confidenceTier === "adversarial_negative";
    const tone = positive ? "var(--recovered)" : adversarial ? "var(--reject)" : "var(--ink-faint)";
    return (
      <button
        key={c.compound.name}
        onClick={() => onSelect(c.compound.name)}
        className="panel"
        style={{
          textAlign: "left", padding: "11px 13px", cursor: "pointer",
          borderColor: on ? tone : "var(--line)", background: on ? "var(--bg-3)" : "var(--bg-2)",
          display: "flex", flexDirection: "column", gap: 5,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: tone, flex: "0 0 auto" }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{c.compound.name}</span>
        </span>
        <span className="mono faint" style={{ fontSize: 9.5, letterSpacing: "0.02em" }}>{c.confidenceTier}</span>
      </button>
    );
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", marginBottom: 14 }}>
        <span className="mono" style={{ fontSize: 12, color: "var(--recovered)" }}>recovered {pos.length}</span>
        <span className="mono faint" style={{ fontSize: 12 }}>/</span>
        <span className="mono" style={{ fontSize: 12, color: "var(--reject)" }}>rejected {neg.length}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
        {[...pos, ...neg].map(Cell)}
      </div>
    </div>
  );
}

// ---- Honest discovery map ----
function verdictMeta(v: string): { label: string; tone: string } {
  switch (v) {
    case "coverage_killed": return { label: "coverage-killed", tone: "var(--ink-faint)" };
    case "confounder_killed": return { label: "confounder-killed", tone: "var(--uncertain)" };
    case "qualified_lead": return { label: "qualified lead", tone: "var(--signal)" };
    case "conditional_lead": return { label: "conditional lead", tone: "var(--signal)" };
    case "skip": return { label: "skipped", tone: "var(--ink-faint)" };
    default: return { label: v, tone: "var(--ink-faint)" };
  }
}

export function DiscoveryPanel({ map }: { map: DiscoveryMap }) {
  return (
    <div>
      <SectionHead kicker="The honest part" title="Where AI-driven discovery works, and where it does not" />
      <p className="dim" style={{ fontSize: 16, maxWidth: "70ch", marginBottom: 26 }}>{map.headline}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {map.axes.map((a: DiscoveryAxis) => {
          const m = verdictMeta(a.verdict);
          return (
            <div key={a.name} className="panel" style={{ padding: 16, borderColor: a.isLead ? "color-mix(in srgb, var(--signal) 35%, transparent)" : "var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.25 }}>{a.name}</span>
                {a.isLead && <span className="chip signal" style={{ flex: "0 0 auto" }}>lead</span>}
              </div>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.05em", color: m.tone, textTransform: "uppercase" }}>{m.label}</span>
              {(a.metric || a.coverage) && (
                <div className="mono faint" style={{ fontSize: 10.5, marginTop: 6 }}>
                  {[a.coverage, a.metric].filter(Boolean).join("  /  ")}
                </div>
              )}
              <p className="dim" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>{a.reason}</p>
            </div>
          );
        })}
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 20, maxWidth: "72ch", lineHeight: 1.55 }}>{map.note}</p>
    </div>
  );
}

// ---- Dual interface (MCP) ----
export function MCPPanel({ example }: { example: CompoundResult | null }) {
  const tools = [
    ["assess_compound", "resolve, grade, reconstruct, trace"],
    ["synthesize_assessment", "calibrated prose (Claude), cited"],
    ["run_validation", "recover 12 / reject 15, fp=fn=0"],
    ["get_pathway", "endorsed AOP, grounded"],
    ["discovery_map", "the negative-results map"],
    ["resolve_compound", "DTXSID-first, salt-form correct"],
  ];
  const snippet = example
    ? JSON.stringify(
        {
          tool: "assess_compound",
          input: { id: example.compound.name },
          output: { call: example.recovery.call, tier: example.confidenceTier, rationale: example.recovery.rationale },
        },
        null,
        2,
      )
    : "";
  return (
    <div>
      <SectionHead kicker="One engine, two interfaces" title="An external agent queries the same engine" />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.8fr) 1.2fr", gap: 16 }}>
        <div className="panel" style={{ padding: 20 }}>
          <span className="mono faint" style={{ fontSize: 11 }}>MCP tools</span>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {tools.map(([name, desc]) => (
              <div key={name} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--signal)" }}>{name}</span>
                <span className="faint" style={{ fontSize: 12 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{ padding: 20, overflow: "auto" }}>
          <span className="mono faint" style={{ fontSize: 11 }}>example call</span>
          <pre className="mono" style={{ fontSize: 12, color: "var(--ink-dim)", margin: "12px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{snippet}</pre>
        </div>
      </div>
    </div>
  );
}
