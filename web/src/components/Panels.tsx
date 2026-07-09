import { useEffect } from "react";
import type { ReactNode } from "react";
import type {
  CompoundResult,
  EvidenceStrand,
  ValidationResult,
  DiscoveryMap,
  DiscoveryAxis,
  Synthesis,
  Benchmark,
  SourceRef,
} from "@contract";
import { REFERENCES, REF_CATS, refNumber, CITE_KIND_TO_REF } from "../references";

// Link a synthesis citation to its entry on the in-app references page.
const citeHref = (kind: string) => `#ref-${CITE_KIND_TO_REF[kind] ?? ""}`;

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
export function EvidencePanel({ result, onOpenProvenance }: { result: CompoundResult; onOpenProvenance: (s: EvidenceStrand) => void }) {
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
          <button
            key={i}
            onClick={() => onOpenProvenance(st)}
            title="View provenance"
            style={{
              display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, padding: "13px 4px",
              borderTop: i ? "1px solid var(--line)" : "none", textAlign: "left",
              background: "transparent", border: "none", borderTopStyle: i ? "solid" : "none",
              borderTopColor: "var(--line)", borderTopWidth: i ? 1 : 0, cursor: "pointer", color: "inherit",
            }}
            className="strand-row"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: statusTone(st.status), flex: "0 0 auto" }} />
              <span style={{ fontSize: 14 }}>{STRAND_LABEL[st.kind] ?? st.kind}</span>
            </div>
            <div>
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.04em", color: statusTone(st.status), textTransform: "uppercase" }}>{st.status.replace("_", " ")}</span>
              <p className="dim" style={{ fontSize: 13.5, margin: "4px 0 0" }}>{st.detail}</p>
              <p className="faint mono" style={{ fontSize: 10.5, marginTop: 4 }}>{st.source} / click for provenance</p>
            </div>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
        Strands ground and calibrate confidence. They never gate the recovery call, which rests on
        curated mechanism alone. Assay activity is shown because it is present, not because it decides.
      </p>
    </div>
  );
}

// ---- Provenance drawer (auditable access route for a strand) ----
export function ProvenanceDrawer({ strand, onClose }: { strand: EvidenceStrand | null; onClose: () => void }) {
  if (!strand) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(4,6,9,0.55)", backdropFilter: "blur(2px)" }} />
      <aside
        className="panel drawer-in"
        style={{
          position: "absolute", right: 0, top: 0, height: "100dvh", width: "min(440px, 92vw)",
          borderRadius: 0, borderRight: "none", borderTop: "none", borderBottom: "none",
          padding: 26, overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span className="eyebrow">Provenance</span>
          <button className="btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={onClose}>Close</button>
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>{STRAND_LABEL[strand.kind] ?? strand.kind}</h3>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", color: statusTone(strand.status), textTransform: "uppercase" }}>{strand.status.replace("_", " ")}</span>

        <Field label="Finding">{strand.detail}</Field>
        <Field label="Source">{strand.source}</Field>
        <Field label="Access route">{strand.provenance || "n/a"}</Field>

        <div className="hair" style={{ margin: "22px 0 16px" }} />
        <p className="faint" style={{ fontSize: 12, lineHeight: 1.55 }}>
          This strand grounds and calibrates confidence. It never gates the recovery call, which rests on
          curated mechanism alone (isGate = {String(strand.isGate)}).
        </p>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="mono faint" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div className="dim" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

// ---- Sources / references (every [E#] marker links here) ----
export function SourcesPanel({ sources }: { sources: SourceRef[] }) {
  const roleTone = (r: string) =>
    r === "diagnostic" ? "var(--recovered)" : r === "grounding" ? "var(--neuron)" : r === "identity" ? "var(--signal)" : "var(--uncertain)";
  return (
    <div>
      <SectionHead kicker="Every claim is traceable" title="Sources and references" />
      <p className="dim" style={{ fontSize: 15, maxWidth: "72ch", marginBottom: 22 }}>
        The engine reasons only over curated, citable sources. Each evidence marker in a synthesis
        links to the matching source below, and every entry links to the original material.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {sources.map((s) => (
          <div key={s.key} className="panel" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}>{s.name}</a>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: roleTone(s.role), flex: "0 0 auto" }}>{s.role}</span>
            </div>
            <p className="dim" style={{ fontSize: 12.5, lineHeight: 1.5, margin: "0 0 10px" }}>{s.reference}</p>
            <a href={s.url} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11.5, color: "var(--signal)", wordBreak: "break-all", textDecoration: "none" }}>{s.url}</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- References: the single canonical, academic-format citation list ----
export function ReferencesPanel() {
  return (
    <div>
      <SectionHead kicker="Every claim is traceable — one place for the literature" title="References" />
      <p className="dim" style={{ fontSize: 15, maxWidth: "74ch", marginBottom: 24 }}>
        The engine reasons only over curated, citable sources. Every <span className="mono">[E#]</span> marker
        and in-app citation links here; each entry links to the original material. This is the full body of
        literature considered across the build — data sources, epidemiology, prior art, and mechanistic grounding.
      </p>
      {REF_CATS.map(({ cat, label }) => {
        const items = REFERENCES.filter((r) => r.cat === cat);
        return (
          <div key={cat} style={{ marginBottom: 28 }}>
            <div className="mono faint" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
              {items.map((r) => (
                <li key={r.id} id={`ref-${r.id}`} style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 10, scrollMarginTop: 96 }}>
                  <span className="mono faint" style={{ fontSize: 12.5 }}>[{refNumber.get(r.id)}]</span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                    <span className="dim">{r.authors} </span>
                    <span style={{ color: "var(--ink)" }}>{r.title}.</span>
                    <span className="dim"> {r.venue}. </span>
                    {r.preprint && <span className="mono" style={{ fontSize: 10.5, color: "var(--uncertain)" }}>[preprint] </span>}
                    <a href={r.url} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11.5, color: "var(--signal)", textDecoration: "none", wordBreak: "break-all" }}>{r.url} &#8599;</a>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

// ---- Background modal (the "?" button): what it is and why ----
export function AboutModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const link = (id: string, text: string) => (
    <a href={`#ref-${id}`} onClick={onClose} style={{ color: "var(--signal)", textDecoration: "none" }}>{text}</a>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(4,6,9,0.6)", backdropFilter: "blur(3px)" }} />
      <div className="panel drawer-in" role="dialog" aria-modal="true" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(680px, 92vw)", maxHeight: "86vh", overflowY: "auto", padding: "28px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span className="eyebrow">Background</span>
          <button className="btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={onClose}>Close</button>
        </div>
        <h2 style={{ fontSize: 24, marginBottom: 16 }}>What Aitiome is, and why</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 14.5, lineHeight: 1.62, color: "var(--ink-dim)" }}>
          <p><b style={{ color: "var(--ink)" }}>The problem.</b> Most Parkinson's and Alzheimer's is sporadic: inherited monogenic causes explain only a minority of risk — common-variant heritability is roughly 16–36% for Parkinson's ({link("nalls2019", "Nalls et al. 2019")}; {link("bloem2021", "Bloem et al. 2021")}) and the large majority of Alzheimer's is late-onset and polygenic ({link("bellenguez2022", "Bellenguez et al. 2022")}). Environmental exposure is a major, growing focus for the rest — pesticides, metals, solvents, and air pollution have been associated with both diseases ({link("dorsey2025", "Dorsey 2025")}; {link("lefevre2024", "Lefèvre-Arbogast et al. 2024")}), and the 2024 Lancet Commission attributes a large share of dementia to modifiable, largely environmental factors ({link("livingston2024", "Livingston et al. 2024")}). In 2024 the field called for AI that connects chemicals to disease mechanism ({link("miller2024", "Miller et al. 2024")}).</p>
          <p><b style={{ color: "var(--ink)" }}>Why it's hard.</b> Tens of thousands of chemicals are bioactive in assays, yet only a small, curated set are established human neurotoxicants ({link("grandjean2014", "Grandjean & Landrigan 2014")}). Activity-based screening does not separate them: high-throughput assays cover only ~40% of neural-relevant targets and miss the oxidative-stress key events behind most neurotoxicity ({link("mack2024", "Mack et al. 2024")}). On our own validation set, every bioactivity signal scores at or below chance against adversarial mitochondria-active decoys — it is anti-diagnostic here.</p>
          <p><b style={{ color: "var(--ink)" }}>Aitiome is a mechanistic reasoning engine.</b> Given a chemical, it reconstructs the OECD-endorsed causal pathway to a neurodegeneration hallmark, grades it only on curated diagnostic evidence — curated CTD DirectEvidence ({link("ctd", "CTD")}) or a registered AOP stressor ({link("aopwiki", "AOP-Wiki")}), never on bioactivity — grounds each edge in queryable evidence, and rates its confidence. It runs per disease: Parkinson's and Alzheimer's, the identical machinery.</p>
          <p><b style={{ color: "var(--ink)" }}>Evidence-based, and calibrated.</b> It is a validation-and-calibration engine, not a novel-discovery predictor. It recovers the known neurotoxicants, rejects the imposters, quantifies the falsification, and maps the discovery limits it cannot cross — shown, not hidden. Alzheimer's is calibrated below Parkinson's, where the evidence is thinner and the AD adverse-outcome pathways are not yet OECD-endorsed.</p>
        </div>
        <div className="hair" style={{ margin: "20px 0 14px" }} />
        <p className="faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          The full body of literature and data sources considered is in the <a href="#references" onClick={onClose} style={{ color: "var(--signal)", textDecoration: "none" }}>References</a>. Every <span className="mono">[E#]</span> marker links there.
        </p>
      </div>
    </div>
  );
}

// ---- Reasoning synthesis (Claude evidence-reasoner) ----
export function SynthesisPanel({ syn }: { syn: Synthesis }) {
  const claude = syn.source === "claude";
  // split the prose so [E#] markers can be tied to (and linked from) the citations
  const parts = syn.prose.split(/(\[E\d+\])/g);
  const citeByMarker = new Map(syn.citations.map((c) => [c.marker, c]));
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
        {parts.map((p, i) => {
          if (!/^\[E\d+\]$/.test(p)) return <span key={i}>{p}</span>;
          const c = citeByMarker.get(p.slice(1, -1));
          const sup = <sup className="mono" style={{ fontSize: 10.5, padding: "0 1px" }}>{p}</sup>;
          return c ? (
            <a key={i} href={citeHref(c.kind)} title={c.reference || c.detail}
              style={{ color: "var(--signal)", textDecoration: "none" }}>{sup}</a>
          ) : (
            <span key={i} style={{ color: "var(--signal)" }}>{sup}</span>
          );
        })}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {syn.citations.map((c) => (
          <a key={c.marker} href={citeHref(c.kind)} className="chip cite-link" title={c.reference || c.detail}
            style={{ textDecoration: "none", cursor: "pointer" }}>
            <span className="mono" style={{ color: "var(--signal)" }}>{c.marker}</span>
            {STRAND_LABEL[c.kind] ?? c.kind}
          </a>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 11.5, marginTop: 14 }}>
        The synthesis explains the reasoning. It never makes or changes the recovery call, which is
        curated and fixed. Evidence is cited by marker to the references below; nothing is invented.
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

// ---- Full validation panel (disease-scoped) (the trust proof) ----
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

// ---- Discovery map (negative results) ----
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
      <SectionHead kicker="The limits, mapped" title="Where AI-driven discovery works, and where it does not" />
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

// ---- Adversarial-specificity centerpiece ----
const DECOYS = ["troglitazone", "prochloraz", "propiconazole", "simvastatin", "fenofibrate", "warfarin"];

export function SpecificityCenterpiece({ result, decoyId, onSelect }: { result: CompoundResult | null; decoyId: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <SectionHead kicker="The specificity result" title="It is not fooled by the imposters" />
      <p className="dim" style={{ fontSize: 16, maxWidth: "70ch", marginBottom: 22 }}>
        Every profiling and similarity axis failed here because the decoys are genuinely bioactive,
        even mitochondria-active. Aitiome withholds the call anyway, because it reasons on curated
        mechanism. Pick a decoy: the left shows what fools an activity model; the right shows why the
        engine does not.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {DECOYS.map((d) => {
          const on = decoyId.toLowerCase() === d;
          return (
            <button key={d} className="btn" onClick={() => onSelect(d)}
              style={{ padding: "7px 13px", fontSize: 13, borderColor: on ? "var(--reject)" : "var(--line-2)", background: on ? "color-mix(in srgb, var(--reject) 15%, var(--bg-3))" : "var(--bg-3)" }}>
              {d}
            </button>
          );
        })}
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
          <ImposterCard c={result} />
          <RejectionCard result={result} />
        </div>
      )}
    </div>
  );
}

function ImposterCard({ c }: { c: CompoundResult }) {
  const cc = c.compound;
  const rows = [
    { label: "Mitochondrial assays", v: cc.mitoActive },
    { label: "Membrane potential (MMP)", v: cc.mmpActive },
    { label: "Oxidative stress", v: cc.oxStressActive },
    { label: "Mechanistic assays (total)", v: cc.mechActiveTotal },
    { label: "ToxCast active (all)", v: cc.toxcastActive },
  ];
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="panel" style={{ padding: 22 }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--uncertain)" }}>What fools an activity model</span>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 13 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13 }}>{r.label}</span>
              <span className="mono" style={{ fontSize: 12.5, color: r.v > 0 ? "var(--uncertain)" : "var(--ink-faint)" }}>{r.v}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "var(--line)" }}>
              <div style={{ height: "100%", width: `${(r.v / max) * 100}%`, background: "var(--uncertain)", borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
        Bioactive, and often mitochondria-active. On multi-assay fingerprint similarity the decoys
        collapse into the positives (0.53), which is why bioactivity cannot be the discriminator.
      </p>
    </div>
  );
}

function RejectionCard({ result }: { result: CompoundResult }) {
  const rej = result.rejection;
  const curated = (result.strands ?? []).find((s) => s.kind === "curated_mechanism");
  const lines = rej?.lines ?? (curated ? [curated] : []);
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--recovered)" }}>Why Aitiome does not</span>
        {rej && <span className="chip reject"><span className="dot" />{rej.count} independent line{rej.count === 1 ? "" : "s"}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--reject)", marginTop: 6, flex: "0 0 auto" }} />
            <div>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{STRAND_LABEL[ln.kind] ?? ln.kind}</span>
              <p className="dim" style={{ fontSize: 13, margin: "3px 0 0", lineHeight: 1.5 }}>{ln.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
        The call rests on curated mechanism. Where the decoy is also non-penetrant or shows no
        pharmacovigilance signal, those are independent confirmations, not the reason.
      </p>
    </div>
  );
}

// ---- Falsification: why bioactivity cannot do this ----
export function FalsificationPanel({ b }: { b: Benchmark }) {
  const c = b.curatedRule;
  return (
    <div>
      <SectionHead kicker="The falsification" title="Why not just use bioactivity?" />
      <p className="dim" style={{ fontSize: 16, maxWidth: "72ch", marginBottom: 24 }}>
        Computed live from the validation set. If activity could do the job, some bioactivity signal
        would separate the real neurotoxicants from the bioactive decoys. None does: every one is at or
        below chance against the decoys, while the curated rule is perfect on the same set.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.3fr", gap: 16 }} className="two-col">
        <div className="panel" style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--recovered)" }}>Curated rule</span>
          <span className="mono" style={{ fontSize: 46, fontWeight: 500, color: "var(--recovered)", marginTop: 8, lineHeight: 1 }}>0</span>
          <span className="lab" style={{ marginTop: 4 }}>errors separating {c.tp} positives from {c.tn} negatives</span>
          <span className="faint mono" style={{ fontSize: 11, marginTop: 10 }}>tp {c.tp} / tn {c.tn} / fp {c.fp} / fn {c.fn}</span>
        </div>
        <div className="panel" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--uncertain)" }}>Bioactivity vs the {b.adversarial} decoys (AUROC)</span>
            <span className="faint mono" style={{ fontSize: 11 }}>0.5 = chance</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {b.bioactivity.map((d) => (
              <AurocRow key={d.name} name={d.name} auroc={d.aurocVsAdversarial} />
            ))}
          </div>
        </div>
      </div>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 18, maxWidth: "74ch", lineHeight: 1.55 }}>{b.interpretation}</p>

      <div className="panel" style={{ padding: 22, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--signal)" }}>Is it circular? Two independent curations converge</span>
          <span className="faint mono" style={{ fontSize: 11 }}>0 false positives either way</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="stat-grid">
          <AblationStat label={b.ablation.ctdName + " alone"} n={b.ablation.ctdRecovered} total={b.ablation.positives} />
          <AblationStat label={b.ablation.aopName + " alone"} n={b.ablation.aopRecovered} total={b.ablation.positives} />
          <AblationStat label="the rule (CTD or AOP)" n={b.ablation.unionRecovered} total={b.ablation.positives} highlight />
        </div>
        <p className="faint" style={{ fontSize: 12.5, marginTop: 16, lineHeight: 1.55 }}>{b.ablation.note}</p>
      </div>
    </div>
  );
}

function AblationStat({ label, n, total, highlight }: { label: string; n: number; total: number; highlight?: boolean }) {
  return (
    <div style={{ padding: "15px 16px", borderRadius: "var(--radius-sm)", border: "1px solid " + (highlight ? "color-mix(in srgb, var(--recovered) 40%, transparent)" : "var(--line)"), background: highlight ? "color-mix(in srgb, var(--recovered) 9%, var(--bg-2))" : "var(--bg-2)" }}>
      <span className="mono" style={{ fontSize: 27, fontWeight: 500, color: highlight ? "var(--recovered)" : "var(--ink)" }}>
        {n}<span className="faint" style={{ fontSize: 15 }}>/{total}</span>
      </span>
      <div className="lab" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

function AurocRow({ name, auroc }: { name: string; auroc: number }) {
  const pct = Math.max(0, Math.min(1, auroc)) * 100;
  const belowChance = auroc <= 0.5;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13 }}>{name}</span>
        <span className="mono" style={{ fontSize: 12.5, color: belowChance ? "var(--reject)" : "var(--ink)" }}>{auroc.toFixed(2)}</span>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--line)" }}>
        {/* chance marker at 0.5 */}
        <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 1, background: "var(--line-2)" }} />
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: belowChance ? "var(--reject)" : "var(--uncertain)" }} />
      </div>
    </div>
  );
}

// ---- Anticipated critiques: red-teaming made visible ----
export function AnticipatedCritiques() {
  const qa = [
    {
      q: "Isn't the recovery circular? The predicate and the positive labels draw on overlapping curated sources.",
      a: "We address it directly above. Two INDEPENDENT curations converge on the positives (CTD 9/13, AOP-Wiki 8/13, together 13/13), neither alone suffices, and neither ever fires on a negative, so this is not one source read twice. The rule has no fitted parameters to overfit. And the decoys were selected for bioactivity, not curation status, so rejecting them is not baked in. Recovery is a sanity check; the contribution is the specificity and the discovery-limits map.",
    },
    {
      q: "You're just detecting bioactivity.",
      a: "Computed on our own data, every bioactivity signal is at or below chance against the decoys (AUROC 0.12 to 0.39). The decoys are, if anything, more bioactive than the real neurotoxicants. Bioactivity is anti-diagnostic here, so the engine never gates on it. Independent support: ToxCast covers only ~40% neural-relevant targets and under-covers the oxidative-stress key events behind most neurotoxicity (Mack et al. 2024).",
    },
    {
      q: "Is complex-I inhibition really the initiating event? Nakamura (PNAS 2008) showed it isn't strictly required.",
      a: "Correct - and it's why we never gate on it. The OECD AOP-3 complex-I MIE is the endorsed causal SCAFFOLD anchor, not a claim that complex-I inhibition is necessary or sufficient. We grade on curated causation, treat bioactivity as anti-diagnostic, and model the convergent routes: paraquat is recovered via the redox-cycling AOP-593 (not complex-I), and the complex II/III/IV family (587/588/589) converges on the same key events. Nakamura et al. (Berthet 2014; CHCHD2, Sci Adv 2025) ground the mitochondrial-dysfunction to dopaminergic-degeneration edge we reconstruct.",
    },
    {
      q: "Why trust a curated rule over a learned model?",
      a: "Both predicate terms are load-bearing (each alone misses several positives) and neither ever fires on a negative (0/15). Every result carries a confidence tier and its evidence provenance, and the discovery limits are shown, not hidden. There was no signal to learn from on this class in the first place, which is the whole point.",
    },
  ];
  return (
    <div>
      <SectionHead kicker="We tried to break it" title="Anticipated critiques, answered on screen" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {qa.map((x) => (
          <div key={x.q} className="panel" style={{ padding: 20 }}>
            <p style={{ fontSize: 14.5, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>{x.q}</p>
            <div className="hair" style={{ margin: "14px 0" }} />
            <p className="dim" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{x.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Convergence & literature: node-level mechanistic grounding + exclusions ----
type Ref = { node: string; who: string; cite: string; ref: string };
const PD_REFS: Ref[] = [
  { node: "MIE - complex-I", who: "MitoCarta3.0", cite: "Complex-I Q-site subunits (our MIE grounding)", ref: "mitocarta" },
  { node: "Mito dysfunction -> DA degeneration", who: "Nakamura lab", cite: "Berthet et al. J Neurosci 2014", ref: "berthet2014" },
  { node: "Complex-I / mito -> PD (recent)", who: "Nakamura lab", cite: "CHCHD2, Science Advances 2025", ref: "chchd2_2025" },
  { node: "Parkinsonian motor deficits (AO)", who: "Kreitzer lab", cite: "Kravitz et al. Nature 2010", ref: "kravitz2010" },
  { node: "Vulnerable DA neurons (AO frame)", who: "Kamath 2022", cite: "SOX6/AGTR1 SN atlas (our AO grounding)", ref: "kamath2022" },
];
const AD_REFS: Ref[] = [
  { node: "Neuroinflammation (KE-188) + BBB", who: "Akassoglou lab", cite: "Merlini et al. Neuron 2019", ref: "merlini2019" },
  { node: "Microglial state resource", who: "Akassoglou lab", cite: "Mendiola et al. Nat Immunol 2023", ref: "mendiola2023" },
  { node: "APOE -> microglia", who: "Huang lab", cite: "Blumenfeld et al. Nat Rev Neurosci 2024", ref: "blumenfeld2024" },
  { node: "TREM2 -> network", who: "Mucke lab", cite: "Das et al. iScience 2021", ref: "das2021" },
  { node: "AD microglia (AO frame)", who: "Bellenguez 2022 / DAM", cite: "GWAS microglia + DAM signature (our AO grounding)", ref: "bellenguez2022" },
];
const METHOD_REFS: Ref[] = [
  { node: "Bioactivity is anti-diagnostic", who: "Mack et al. 2024", cite: "ToxCast ~40% neural-relevant (NeuroToxicology)", ref: "mack2024" },
  { node: "The exposome of neurodegeneration", who: "Miller et al. 2024", cite: "Nature Neuroscience", ref: "miller2024" },
  { node: "Complex-I not strictly required (we pre-empt)", who: "Nakamura lab", cite: "Choi et al. PNAS 2008", ref: "choi2008" },
];
const EXCLUSIONS = [
  ["Bioactivity as a discriminator", "anti-diagnostic here (ToxCast/Tox21/GenRA/DeepTox)"],
  ["Circular knowledge graphs", "ComptoxAI, AlzKB, PrimeKG, Hetionet - CTD/AOP-derived or drug-keyed"],
  ["Structure / QSAR & morphology", "general similarity is not neurotoxicity"],
  ["CTD inferred associations", "inference by study volume; only curated DirectEvidence counts"],
];

export function ConvergencePanel() {
  const Col = ({ title, refs, tone }: { title: string; refs: Ref[]; tone: string }) => (
    <div className="panel" style={{ padding: 20 }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.05em", color: tone }}>{title}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 12 }}>
        {refs.map((r) => (
          <div key={r.node} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{r.node}</span>
            <a href={`#ref-${r.ref}`} className="dim" style={{ fontSize: 12.5, textDecoration: "none", lineHeight: 1.4 }}>
              <span style={{ color: "var(--ink-dim)" }}>{r.who}</span> - {r.cite} <sup className="mono" style={{ color: "var(--signal)" }}>[{refNumber.get(r.ref)}]</sup>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <SectionHead kicker="Grounded in the mechanistic literature" title="Mechanistic convergence, and the sources we refuse" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <Col title="PARKINSON'S NODES" refs={PD_REFS} tone="var(--recovered)" />
        <Col title="ALZHEIMER'S NODES" refs={AD_REFS} tone="var(--signal)" />
        <Col title="METHOD & CALIBRATION" refs={METHOD_REFS} tone="var(--ink-dim)" />
      </div>
      <div className="panel" style={{ padding: "18px 20px", marginTop: 14 }}>
        <span className="mono faint" style={{ fontSize: 11, letterSpacing: "0.05em" }}>THE EXCLUSIONS ARE THE DISCIPLINE - WHAT WE REFUSE TO USE</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px 22px", marginTop: 12 }}>
          {EXCLUSIONS.map(([k, v]) => (
            <div key={k} style={{ fontSize: 12.5 }}>
              <span style={{ color: "var(--reject)", fontWeight: 500 }}>{k}</span>
              <span className="dim"> - {v}</span>
            </div>
          ))}
        </div>
        <p className="dim" style={{ fontSize: 12.5, margin: "14px 0 0", lineHeight: 1.5 }}>
          The field owns the endogenous mechanism; Aitiome adds the exposome layer - which chemicals plug into it.
          We found no prior adversarial mito-active-decoy neurodegeneration benchmark.
        </p>
      </div>
    </div>
  );
}

// ---- Dual interface (MCP) ----
export function MCPPanel({ example }: { example: CompoundResult | null }) {
  const tools = [
    ["assess_compound", "resolve, grade, reconstruct, trace"],
    ["synthesize_assessment", "calibrated prose (Claude), cited"],
    ["run_validation", "recover 13 / reject 15, fp=fn=0"],
    ["get_pathway", "endorsed AOP, grounded"],
    ["discovery_map", "the negative-results map"],
    ["benchmark", "the falsification (bioactivity AUROC vs decoys)"],
    ["sources", "research-style citations with links"],
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
