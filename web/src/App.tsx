import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { getValidation, getHealth, getPathway, getDiscoveryMap, getCandidates, getBenchmark, getDiseases, getCompounds, assess, synthesize, resolveCompound } from "./data";
import { useAsync } from "./useAsync";
import { Hero } from "./hero/Hero";
import { EvidencePanel, TracePanel, ValidationPanel, DiscoveryPanel, CandidatePanel, MCPPanel, SynthesisPanel, ProvenanceDrawer, SpecificityCenterpiece, FalsificationPanel, AnticipatedCritiques, ReferencesPanel, ConvergencePanel, AboutModal } from "./components/Panels";
import { SiteNav, SiteFooter, WelcomeModal, EndOfTourModal, hasSeenWelcome, markWelcomeSeen } from "./site";
import { RlmPage, METHODS, GRID } from "./pages/RlmPage";
import { McpPage } from "./pages/McpPage";
import type { EvidenceStrand, Disease, DiseaseInfo, CompoundResult, ValidationResult, Compound } from "@contract";

// Per-disease showcase sets + copy. PD is the validated anchor; AD is the second
// axis (curated recovery + the drug/polyphenol decoys). One disease on screen.
const AXIS: Record<Disease, {
  known: string[]; decoys: string[]; defaultActive: string; defaultDecoy: string;
  knownLabel: string; decoyLabel: string; headline: string; scoreIntro: string;
  recoveredLabel: string; decoyScoreLabel: string;
}> = {
  pd: {
    known: ["rotenone", "paraquat", "MPTP", "chlorpyrifos", "6-hydroxydopamine"],
    decoys: ["simvastatin", "troglitazone", "warfarin", "fenofibrate"],
    defaultActive: "rotenone", defaultDecoy: "warfarin",
    knownLabel: "known neurotoxicants", decoyLabel: "bioactive decoys",
    headline: "Give it a chemical — Aitiome reconstructs the endorsed causal pathway to Parkinson's, grades it on curated evidence (never bioactivity), and rates its confidence.",
    scoreIntro: "Aitiome grades a chemical on curated mechanism, never on bioactivity. On the reconnaissance ground truth it recovers all thirteen known neurotoxicants (incl. trichloroethylene, the Camp Lejeune solvent) and rejects all fifteen negatives, including six bioactive, mitochondria-active decoys built to fool an activity-based model.",
    recoveredLabel: "known neurotoxicants recovered", decoyScoreLabel: "bioactive decoys not fooled",
  },
  ad: {
    known: ["DDE", "lead acetate", "cadmium chloride", "aluminum chloride", "streptozocin"],
    decoys: ["curcumin", "donepezil", "epigallocatechin gallate", "methylene blue"],
    defaultActive: "DDE", defaultDecoy: "curcumin",
    knownLabel: "curated AD-linked chemicals", decoyLabel: "AD-assay-active decoys",
    headline: "Give it a chemical — Aitiome reconstructs the endorsed causal pathway to Alzheimer's, grades it on curated evidence (never bioactivity), and rates its confidence.",
    scoreIntro: "On Alzheimer's the engine grades on the same curated predicate. Its decoys are the compounds most active on AD assays — the symptomatic AD drugs and dietary polyphenols — which an activity model would flag as hits. Aitiome does not, because it reasons on curated causation, not activity.",
    recoveredLabel: "curated AD-linked chemicals recovered", decoyScoreLabel: "AD-assay-active decoys not fooled",
  },
};

function initialDisease(): Disease {
  const p = new URLSearchParams(window.location.search).get("disease");
  return p === "ad" ? "ad" : "pd";
}

// The guided path for a cold judge: recover -> reject imposter -> falsify ->
// candidate queue -> second axis -> convergence -> dual (human + agent) interface.
// Presenter-paced (click to advance); ends in the end-of-tour modal.
const TOUR: { cap: string; d?: Disease; a?: string; decoy?: string; scroll: string }[] = [
  { cap: "Recover a known neurotoxicant on the OECD-endorsed pathway — grounded edge by edge.", d: "pd", a: "rotenone", scroll: "sec-hero" },
  { cap: "...and reject a bioactive imposter — no curated cause, so no call.", d: "pd", decoy: "warfarin", scroll: "sec-specificity" },
  { cap: "Why not just bioactivity? Every activity signal is at or below chance vs the decoys.", d: "pd", scroll: "sec-falsification" },
  { cap: "Discovery, done honestly: a ranked candidate queue that tells a lab what to test next.", d: "pd", scroll: "sec-candidates" },
  { cap: "A second disease, same method — Alzheimer's, calibrated below Parkinson's where the evidence is thinner.", d: "ad", a: "DDE", scroll: "sec-compare" },
  { cap: "Grounded in the mechanistic literature — and explicit about what we refuse to use.", scroll: "sec-convergence" },
  { cap: "A methods study: RAG vs RAG+ vs RLM vs adversarial RLM — RLM-ADV surfaces ~10× the counter-evidence of RAG.", scroll: "sec-rlm" },
  { cap: "One engine, two interfaces — a scientist and an agent query the same tools over MCP.", scroll: "sec-mcp" },
];

// The App shell wires client-side routes. The main experience lives at "/",
// with standalone pages for the RLM methods study and the MCP interface. Go's
// static handler falls back to index.html, so deep links to these routes work.
export function App() {
  return (
    <Routes>
      <Route path="/" element={<MainExperience />} />
      <Route path="/rlm" element={<RlmPage />} />
      <Route path="/mcp" element={<McpPage />} />
      <Route path="*" element={<MainExperience />} />
    </Routes>
  );
}

function MainExperience() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [disease, setDiseaseState] = useState<Disease>(initialDisease());
  const [activeId, setActiveId] = useState(AXIS[initialDisease()].defaultActive);
  const [provenance, setProvenance] = useState<EvidenceStrand | null>(null);
  const [decoyId, setDecoyId] = useState(AXIS[initialDisease()].defaultDecoy);

  // Switching the disease axis re-contextualizes the whole page and resets the
  // active/decoy compounds to that axis's showcase defaults; persisted in the URL.
  function setDisease(d: Disease) {
    if (d === disease) return;
    setDiseaseState(d);
    setActiveId(AXIS[d].defaultActive);
    setDecoyId(AXIS[d].defaultDecoy);
  }
  useEffect(() => {
    const url = new URL(window.location.href);
    if (disease === "pd") url.searchParams.delete("disease");
    else url.searchParams.set("disease", disease);
    window.history.replaceState({}, "", url);
  }, [disease]);

  const cfg = AXIS[disease];
  const diseases = useAsync(getDiseases, []);
  const health = useAsync(getHealth, []);
  const validation = useAsync(() => getValidation(disease), [disease]);
  const pathway = useAsync(() => getPathway(disease), [disease]);
  const discovery = useAsync(getDiscoveryMap, []);
  const candidates = useAsync(() => getCandidates(disease), [disease]);
  const benchmark = useAsync(getBenchmark, []);
  const active = useAsync(() => assess(activeId, disease), [activeId, disease]);
  const synthesis = useAsync(() => synthesize(activeId), [activeId]);
  const decoy = useAsync(() => assess(decoyId, disease), [decoyId, disease]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
  const [welcome, setWelcome] = useState<boolean>(() => !hasSeenWelcome());
  const [tourDone, setTourDone] = useState(false);
  function runStep(i: number) {
    const st = TOUR[i];
    if (st.d) setDisease(st.d);
    if (st.a) setActiveId(st.a);
    if (st.decoy) setDecoyId(st.decoy);
    setTour(i);
    window.setTimeout(() => document.getElementById(st.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" }), 260);
  }
  function startTour() { markWelcomeSeen(); setWelcome(false); runStep(0); }
  function skipWelcome() { markWelcomeSeen(); setWelcome(false); }
  function finishTour() { setTour(null); setTourDone(true); }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const source = validation?.source ?? "fixture";
  const s = validation?.data.summary;
  const result = active?.data ?? null;
  const info = diseases?.find((d) => d.disease === disease) ?? null;

  return (
    <div className="shell">
      <Masthead live={!!health?.health} onToggle={toggleTheme} theme={theme} onTour={() => runStep(0)} />
      <DiseaseFilter diseases={diseases ?? []} active={disease} onSelect={setDisease} info={info} />

      <main>
        <section id="sec-hero" className="wrap" style={{ paddingTop: 34, paddingBottom: 30 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>The environmental exposome of neurodegeneration</p>
          <h1 style={{ fontSize: "clamp(34px, 5.2vw, 58px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>
            A <span style={{ color: "var(--signal)" }}>mechanistic reasoning engine</span>.
          </h1>
          <p className="dim" style={{ fontSize: "clamp(16px, 1.8vw, 20px)", lineHeight: 1.5, maxWidth: "74ch", marginTop: 18 }}>
            {cfg.headline}
          </p>
          <button
            onClick={() => setAboutOpen(true)}
            className="btn"
            aria-label="What is a mechanistic reasoning engine? Background and citations"
            style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 15px", fontSize: 13.5 }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 999, border: "1px solid var(--signal)", color: "var(--signal)", fontSize: 11, flex: "none" }}>?</span>
            What is a mechanistic reasoning engine?
          </button>

          <div style={{ marginTop: 26 }}>
            <SearchBox disease={disease} onResolve={setActiveId} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Selector cfg={cfg} activeId={activeId} onSelect={setActiveId} />
          </div>

          {pathway && (
            <div style={{ marginTop: 18 }}>
              <Hero pathway={pathway.data} result={result} height={470} disease={disease} />
            </div>
          )}

          {result && (
            <div style={{ marginTop: 18 }}>
              <Readout result={result} onSwitchDisease={setDisease} />
            </div>
          )}

          {synthesis?.data && disease === "pd" && (
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
          <p className="dim" style={{ fontSize: 16, maxWidth: "64ch", marginBottom: 26 }}>{cfg.scoreIntro}</p>
          {s && (
            <Scoreboard
              recovered={`${s.positivesRecovered}/${s.positivesTotal}`}
              rejected={`${s.negativesRejected}/${s.negativesTotal}`}
              decoys={`${s.adversarialRejected}/${s.adversarialTotal}`}
              errors={s.falsePositives + s.falseNegatives}
              recoveredLabel={cfg.recoveredLabel}
              decoyLabel={cfg.decoyScoreLabel}
            />
          )}
          {validation && validation.data.perCompound.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <ValidationPanel data={validation.data} activeId={activeId} onSelect={setActiveId} />
            </div>
          )}
        </section>

        <section id="sec-specificity" className="wrap section">
          <SpecificityCenterpiece result={decoy?.data ?? null} decoyId={decoyId} onSelect={setDecoyId} />
        </section>

        {benchmark && disease === "pd" && (
          <section id="sec-falsification" className="wrap section">
            <FalsificationPanel b={benchmark.data} />
          </section>
        )}

        {disease === "ad" && (
          <section className="wrap section">
            <ADFalsificationNote data={validation?.data ?? null} />
          </section>
        )}

        {discovery && disease === "pd" && (
          <section className="wrap section">
            <DiscoveryPanel map={discovery.data} />
          </section>
        )}

        {candidates && candidates.data.candidates.length > 0 && (
          <section id="sec-candidates" className="wrap section">
            <CandidatePanel queue={candidates.data} />
          </section>
        )}

        <section id="sec-compare" className="wrap section">
          <CompareSection />
        </section>

        <section className="wrap section">
          <AnticipatedCritiques />
        </section>

        <section id="sec-convergence" className="wrap section">
          <ConvergencePanel />
        </section>

        <section id="references" className="wrap section">
          <ReferencesPanel />
        </section>

        <section id="sec-rlm" className="wrap section">
          <RlmMethodsSection />
        </section>

        <section id="sec-mcp" className="wrap section">
          <MCPPanel example={result} />
        </section>
      </main>

      <SiteFooter note={`Evidence-ranked mechanistic hypotheses. Never claims of causation.  ·  data source: ${source}`} />
      {welcome && <WelcomeModal onTour={startTour} onSkip={skipWelcome} />}
      {tourDone && <EndOfTourModal onClose={() => setTourDone(false)} />}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      <ProvenanceDrawer strand={provenance} onClose={() => setProvenance(null)} />
      {tour !== null && (
        <div
          style={{
            position: "fixed", left: "50%", bottom: 22, transform: "translateX(-50%)", zIndex: 60,
            display: "flex", alignItems: "center", gap: 16, maxWidth: "min(760px, 92vw)",
            padding: "12px 14px 12px 18px", borderRadius: 999,
            background: "color-mix(in srgb, var(--bg-2) 92%, transparent)", border: "1px solid var(--line-2)",
            backdropFilter: "blur(12px)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <span className="mono faint" style={{ fontSize: 11, flex: "none" }}>{tour + 1}/{TOUR.length}</span>
          <span style={{ fontSize: 13.5, lineHeight: 1.35 }}>{TOUR[tour].cap}</span>
          <div style={{ display: "flex", gap: 8, flex: "none" }}>
            <button className="btn primary" style={{ padding: "6px 14px" }} onClick={() => (tour < TOUR.length - 1 ? runStep(tour + 1) : finishTour())}>
              {tour < TOUR.length - 1 ? "Next" : "Done"}
            </button>
            <button className="btn" style={{ padding: "6px 12px" }} onClick={() => setTour(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// DiseaseFilter is the top-level axis control: PD · AD chips that contextualize
// the entire page, with the selected axis's endorsement/calibration note inline.
function DiseaseFilter(props: { diseases: DiseaseInfo[]; active: Disease; onSelect: (d: Disease) => void; info: DiseaseInfo | null }) {
  const list = props.diseases.length ? props.diseases : [
    { disease: "pd" as Disease, short: "Parkinson's" }, { disease: "ad" as Disease, short: "Alzheimer's" },
  ] as DiseaseInfo[];
  return (
    <div
      className="wrap"
      style={{
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        paddingTop: 14, paddingBottom: 14, borderBottom: "1px solid var(--line)",
        position: "sticky", top: 68, zIndex: 15,
        backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 82%, transparent)",
      }}
    >
      <span className="mono faint" style={{ fontSize: 11.5, letterSpacing: "0.06em" }}>disease axis</span>
      <div style={{ display: "flex", gap: 8 }}>
        {list.map((d) => {
          const on = props.active === d.disease;
          const tone = d.disease === "ad" ? "var(--signal)" : "var(--recovered)";
          return (
            <button
              key={d.disease}
              onClick={() => props.onSelect(d.disease)}
              className="btn"
              aria-pressed={on}
              style={{
                padding: "7px 15px", fontSize: 13.5, fontWeight: on ? 600 : 400,
                borderColor: on ? tone : "var(--line-2)",
                background: on ? `color-mix(in srgb, ${tone} 16%, var(--bg-3))` : "var(--bg-3)",
                color: on ? "var(--ink)" : "var(--ink-dim)",
              }}
            >
              {d.short}
            </button>
          );
        })}
      </div>
      {props.info && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
          <span className={`chip ${props.info.anchorEndorsed ? "recovered" : "signal"}`} style={{ flex: "none" }}>
            <span className="dot" />AOP-{props.info.anchorAop} {props.info.anchorEndorsed ? "endorsed anchor" : "exploratory"}
          </span>
          <span className="faint" style={{ fontSize: 12, lineHeight: 1.35 }}>{props.info.note}</span>
        </div>
      )}
    </div>
  );
}

// CompareSection is the head-to-head PD vs AD view — the "equivalent rigor,
// evidence-based calibration thesis made explicit. Recovery numbers are live; the other
// rows are calibrated statements with a 0-3 strength rating so AD's genuinely
// weaker dimensions (quantified falsification, circularity defense, data breadth)
// are shown, not hidden. This is the calibration centerpiece for a two-axis engine.
function CompareSection() {
  const pd = useAsync(() => getValidation("pd"), []);
  const ad = useAsync(() => getValidation("ad"), []);
  const ps = pd?.data.summary;
  const as = ad?.data.summary;
  const recPD = ps ? `${ps.positivesRecovered}/${ps.positivesTotal} recovered · ${ps.negativesRejected}/${ps.negativesTotal} rejected · ${ps.falsePositives + ps.falseNegatives} err` : "—";
  const recAD = as ? `${as.positivesRecovered}/${as.positivesTotal} recovered · ${as.negativesRejected}/${as.negativesTotal} rejected · ${as.falsePositives + as.falseNegatives} err` : "—";

  const rows: { dim: string; pd: [string, number]; ad: [string, number] }[] = [
    { dim: "Mechanistic scaffold (OECD)", pd: ["AOP-3, fully WPHA/WNT-endorsed; complete MIE→AO chain", 3], ad: ["AOP-12/48 endorsed anchor + non-endorsed Tau/amyloid overlay (429/475); no endorsed amyloid/tau AO", 2] },
    { dim: "Curated recovery (ground truth)", pd: [recPD, 3], ad: [recAD, 3] },
    { dim: "Predictive power / falsification", pd: ["Quantified: every bioactivity signal at or below chance vs decoys — anti-diagnostic", 3], ad: ["Qualitative: the decoys are the AD drugs & polyphenols; quantified assay-AUROC pending AD-assay data", 1] },
    { dim: "Curated data quality", pd: ["CTD PD DirectEvidence + AOP-Wiki — two independent curations", 3], ad: ["CTD AD DirectEvidence (pulled live); AOP leg thinner; endogenous-metabolite noise filtered by scope", 2] },
    { dim: "Circularity defense", pd: ["Two independent curations converge: 8/12 + 8/12 → 12/12", 3], ad: ["Leans mostly on CTD-alone (weaker AOP leg) — disclosed, not claimed", 1] },
    { dim: "Human epidemiology", pd: ["Quantified (paraquat ~2.5×, rotenone OR ~10)", 3], ad: ["DDE (Richardson 2014), lead cohort HR~3; aluminum contested", 2] },
  ];

  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 12 }}>The two axes, compared</p>
      <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)", maxWidth: "22ch", marginBottom: 8 }}>
        The same method, calibrated to the evidence.
      </h2>
      <p className="dim" style={{ fontSize: 15, maxWidth: "70ch", marginBottom: 22 }}>
        Alzheimer's runs through the identical curated-diagnostic engine as Parkinson's. Where AD is
        genuinely weaker — no endorsed amyloid/tau outcome, a thinner causal literature, no quantified
        falsification yet — the rating says so. That calibration is the product working as designed.
      </p>
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="cmp-row cmp-head">
          <div className="cmp-dim mono faint">dimension</div>
          <div className="cmp-cell"><span className="chip recovered" style={{ flex: "none" }}><span className="dot" />Parkinson's</span></div>
          <div className="cmp-cell"><span className="chip signal" style={{ flex: "none" }}><span className="dot" />Alzheimer's</span></div>
        </div>
        {rows.map((r) => (
          <div className="cmp-row" key={r.dim}>
            <div className="cmp-dim">{r.dim}</div>
            <CmpCell text={r.pd[0]} strength={r.pd[1]} tone="var(--recovered)" />
            <CmpCell text={r.ad[0]} strength={r.ad[1]} tone="var(--signal)" />
          </div>
        ))}
        <div className="cmp-bridge">
          <span className="mono" style={{ color: "var(--signal)", fontSize: 11.5, letterSpacing: "0.05em" }}>shared / cross-disease&nbsp;&nbsp;</span>
          <span className="dim" style={{ fontSize: 13.5 }}>
            <b>KE-188 (neuroinflammation)</b> is the identical node bridging both AOPs; <b>lead is positive for both</b> (PD broad leg, AD endorsed AOP-12); mitochondrial dysfunction is an <b>unlinked gap</b> (PD KE-177 vs AD placeholder KE-1816) — shown on the discovery map, not papered over.
          </span>
        </div>
      </div>
    </div>
  );
}

// RlmMethodsSection: the RAG/RAG+/RLM/RLM-ADV methods study, surfaced on the main
// page (and covered by the guided tour) so a presenter can narrate the methodology.
// Data is shared with the full /rlm page (METHODS, GRID) — single source of truth.
function RlmMethodsSection() {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 12 }}>A methods study — how should Claude synthesize evidence?</p>
      <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)", maxWidth: "26ch", marginBottom: 12 }}>
        Beyond RAG: RAG vs RAG+ vs RLM vs adversarial RLM
      </h2>
      <p className="dim" style={{ fontSize: 15, maxWidth: "72ch", marginBottom: 20 }}>
        Aitiome grades on a deterministic gate — but assembling the surrounding evidence is a reasoning task, and
        how a model does it matters. We compared four evidence-synthesis methods on one shared deterministic
        scorer across six chemicals. Each method, in one line:
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 22 }} className="two-col">
        {METHODS.map((m) => (
          <div key={m.key} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span className="mono" style={{ color: m.tone, fontWeight: 600, fontSize: 13.5, minWidth: 74, flex: "none" }}>{m.name}</span>
            <span className="dim" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{m.what}</span>
          </div>
        ))}
      </div>
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="rlm-grid rlm-head">
          <div className="mono faint">mean per chemical</div>
          {METHODS.map((m) => (<div key={m.key} className="mono" style={{ fontWeight: 600, color: m.tone }}>{m.name}</div>))}
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
      <p style={{ fontSize: 16, color: "var(--signal)", lineHeight: 1.45, marginTop: 18, maxWidth: "70ch" }}>
        The finding: adversarial RLM surfaced <b style={{ color: "var(--ink)" }}>~10× more counter-evidence than
        RAG and ~2.2× more than the strong RAG+ baseline</b> — the property a calibrated-honesty tool needs most.
        Its critic refutes (0/6 diagnostic recovery), so it pairs with RLM-1, which builds the case.
      </p>
      <div style={{ marginTop: 16 }}>
        <Link to="/rlm" className="btn primary" style={{ textDecoration: "none" }}>Full methodology &amp; comparison →</Link>
      </div>
    </div>
  );
}

function CmpCell({ text, strength, tone }: { text: string; strength: number; tone: string }) {
  return (
    <div className="cmp-cell">
      <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: i < strength ? tone : "var(--line-2)" }} />
        ))}
      </div>
      <span className="dim" style={{ fontSize: 13, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// ADFalsificationNote: AD specificity story. Two real, quantified pieces
// (the source-independence ablation, computed live from the AD validation predicate)
// + the qualitative decoy trap, and an explicit statement of the one gap (assay-AUROC)
// with WHY it's structurally hard (Mack 2024) rather than a fabricated number.
function ADFalsificationNote({ data }: { data: ValidationResult | null }) {
  const pos = (data?.perCompound ?? []).filter((r) => r.role === "positive");
  const negs = (data?.perCompound ?? []).filter((r) => r.role === "negative");
  const ctd = pos.filter((r) => r.recovery.predicate.ctdPdDirectEvidence).length;
  const aop = pos.filter((r) => r.recovery.predicate.neuroAopStressor).length;
  const union = pos.filter((r) => r.recovery.predicate.ctdPdDirectEvidence || r.recovery.predicate.neuroAopStressor).length;
  const fp = negs.filter((r) => r.recovery.call === "positive").length;
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 12 }}>The falsification, Alzheimer's — weaker, and shown</p>
      <h2 style={{ fontSize: "clamp(22px,2.6vw,30px)", maxWidth: "24ch", marginBottom: 14 }}>The decoys are the treatments</h2>
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="panel" style={{ padding: "20px 22px" }}>
          <div className="mono faint" style={{ fontSize: 11, marginBottom: 10 }}>SOURCE-INDEPENDENCE ABLATION (live)</div>
          {pos.length > 0 ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 22, flexWrap: "wrap" }}>
                <Stat n={`${ctd}/${pos.length}`} l="CTD-AD alone" tone="var(--recovered)" />
                <span style={{ color: "var(--ink-faint)" }}>+</span>
                <Stat n={`${aop}/${pos.length}`} l="AD-AOP alone" tone="var(--recovered)" />
                <span style={{ color: "var(--ink-faint)" }}>→</span>
                <Stat n={`${union}/${pos.length}`} l="the rule" tone="var(--signal)" />
              </div>
              <p className="dim" style={{ fontSize: 13.5, marginTop: 14, marginBottom: 0 }}>
                The result: AD recovery leans <b>almost entirely on CTD curation</b> — the endorsed AD-AOP
                leg contributes only {aop} (lead, via AOP-12). So unlike Parkinson's, this is <b>not</b> two
                strong independent curations converging. We show it rather than claim it. Still <b>{fp}/{negs.length}</b>
                &nbsp;false positives — the decoys are rejected.
              </p>
            </>
          ) : <p className="dim" style={{ fontSize: 13.5 }}>Ablation loads from the live engine.</p>}
        </div>
        <div className="panel" style={{ padding: "20px 22px" }}>
          <div className="mono faint" style={{ fontSize: 11, marginBottom: 10 }}>WHY NO QUANTIFIED ASSAY-AUROC (YET)</div>
          <p className="dim" style={{ fontSize: 13.5, marginTop: 0 }}>
            The compounds most active on AD assays are symptomatic AD <b>drugs</b> (donepezil and galantamine —
            cholinergic; methylene blue — investigational anti-tau) and dietary <b>polyphenols</b> (curcumin, EGCG)
            — an activity model would flag them as hits. None carries curated AD DirectEvidence, so Aitiome
            withholds the call.
          </p>
          <p className="dim" style={{ fontSize: 13.5, marginBottom: 0 }}>
            A quantified assay-AUROC (as for PD) is <b>pending AD-specific assay data</b>, and is structurally
            hard: ToxCast covers only ~40% neural-relevant targets and under-covers the oxidative-stress key
            events behind most neurotoxicity (Mack et al. 2024). We report the gap, not a fabricated score.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l, tone }: { n: string; l: string; tone: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 30, color: tone, lineHeight: 1 }}>{n}</div>
      <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>{l}</div>
    </div>
  );
}

// A typeahead suggestion: a benchmark compound, plus the identifier that matched
// when the match was NOT on the name (so "1910-42-5" surfaces paraquat and shows why).
type Suggestion = { c: Compound; via?: string };

// rankSuggestions ranks the curated set by what the user is most likely to try.
// Empty query -> the showcase compounds (known + decoys, chip order) as "likely picks".
// Typed query -> name-prefix > name-substring > identifier match, showcase-first on ties.
// The universe is only ever the curated benchmark: the typeahead can never suggest a
// compound that would not resolve, but free-typed out-of-set text is still allowed.
function rankSuggestions(pool: Compound[], q: string, showcase: string[]): Suggestion[] {
  const prio = (c: Compound) => {
    const i = showcase.indexOf(c.name.toLowerCase());
    return i < 0 ? 999 : i;
  };
  const ql = q.trim().toLowerCase();
  if (!ql) {
    return showcase
      .map((n) => pool.find((c) => c.name.toLowerCase() === n))
      .filter((c): c is Compound => !!c)
      .slice(0, 8)
      .map((c) => ({ c }));
  }
  const scored: { c: Compound; via?: string; score: number }[] = [];
  for (const c of pool) {
    const name = c.name.toLowerCase();
    if (name.startsWith(ql)) { scored.push({ c, score: 0 }); continue; }
    if (name.includes(ql)) { scored.push({ c, score: 1 }); continue; }
    const aliases: [string, string | undefined][] = [
      ["CAS", c.cas], ["", c.dtxsid], ["InChIKey", c.inchikey],
      ["CAS", c.toxcastCas], ["CID", c.cid != null ? String(c.cid) : undefined],
    ];
    const hit = aliases.find(([, v]) => v && v.toLowerCase().includes(ql));
    if (hit) scored.push({ c, via: hit[0] ? `${hit[0]} ${hit[1]}` : hit[1], score: 2 });
  }
  scored.sort((a, b) => a.score - b.score || prio(a.c) - prio(b.c) || a.c.name.localeCompare(b.c.name));
  return scored.slice(0, 8).map(({ c, via }) => ({ c, via }));
}

function SearchBox(props: { disease: Disease; onResolve: (name: string) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; kind: "ok" | "warn" } | null>(null);
  const [pool, setPool] = useState<Compound[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const dz = props.disease === "ad" ? "Alzheimer's" : "Parkinson's";

  // The resolvable universe is the curated benchmark for the active axis — load it so
  // the typeahead suggests exactly what will resolve (and re-load when the axis flips).
  useEffect(() => {
    let live = true;
    setQ(""); setNote(null); setOpen(false); setHi(-1);
    getCompounds(props.disease).then((r) => { if (live) setPool(r.data); });
    return () => { live = false; };
  }, [props.disease]);

  // "Likely to try" first: the showcase known + decoys, in chip order. Everything else
  // in the curated set is still reachable by typing any name or identifier.
  const showcase = [...AXIS[props.disease].known, ...AXIS[props.disease].decoys].map((s) => s.toLowerCase());
  const suggestions = rankSuggestions(pool, q, showcase);

  async function run(name?: string) {
    const id = (name ?? q).trim();
    if (!id || busy) return;
    setOpen(false);
    setBusy(true);
    setNote(null);
    const c = await resolveCompound(id, props.disease);
    setBusy(false);
    if (c) {
      props.onResolve(c.name);
      const salt = c.toxcastCas && c.toxcastCas !== c.cas ? ` · tested as CAS ${c.toxcastCas}` : "";
      setNote({ text: `✓ Resolved → ${c.name} · ${c.dtxsid || "identity pending"}${salt}. The assessment is below.`, kind: "ok" });
    } else {
      setNote({
        text: `"${id}" is not in the curated benchmark. Aitiome grades only compounds with curated evidence — its ground-truth set (a chip below). Identity resolution accepts a name, CAS, DTXSID or InChIKey of a benchmark compound — e.g. paraquat's dichloride salt, CAS 1910-42-5, resolves to paraquat.`,
        kind: "warn",
      });
    }
  }

  function choose(s: Suggestion) {
    setQ(s.c.name);
    setOpen(false);
    setHi(-1);
    run(s.c.name);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(-1); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, suggestions.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, -1)); }
              else if (e.key === "Enter") { e.preventDefault(); if (open && hi >= 0 && suggestions[hi]) choose(suggestions[hi]); else run(); }
              else if (e.key === "Escape") { setOpen(false); setHi(-1); }
            }}
            placeholder="Resolve a chemical by name, CAS, DTXSID, or InChIKey"
            aria-label="Resolve a chemical"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-autocomplete="list"
            autoComplete="off"
            className="mono"
            style={{
              width: "100%", padding: "11px 14px", fontSize: 13.5,
              background: "var(--bg-2)", color: "var(--ink)",
              border: "1px solid var(--line-2)", borderRadius: "var(--radius-sm)", outline: "none",
            }}
            onFocus={(e) => { setOpen(true); e.currentTarget.style.borderColor = "var(--signal)"; }}
            onBlur={(e) => { setTimeout(() => setOpen(false), 120); e.currentTarget.style.borderColor = "var(--line-2)"; }}
          />
          {open && suggestions.length > 0 && (
            <div className="panel" role="listbox" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40, padding: 6, maxHeight: 340, overflowY: "auto" }}>
              {!q.trim() && (
                <div className="mono faint" style={{ fontSize: 10.5, letterSpacing: "0.05em", padding: "6px 8px 4px" }}>
                  LIKELY PICKS · {pool.length} in the curated {dz} set
                </div>
              )}
              {suggestions.map((s, i) => (
                <button
                  key={s.c.name}
                  role="option"
                  aria-selected={i === hi}
                  // onMouseDown (not onClick) so it fires before the input blur closes the list
                  onMouseDown={(e) => { e.preventDefault(); choose(s); }}
                  onMouseEnter={() => setHi(i)}
                  className="mono"
                  style={{
                    display: "flex", alignItems: "baseline", gap: 10, width: "100%", textAlign: "left",
                    padding: "8px 10px", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer",
                    background: i === hi ? "var(--bg-3)" : "transparent", color: "var(--ink)",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{s.c.name}</span>
                  <span className="faint" style={{ fontSize: 10.5, marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {s.via ?? s.c.dtxsid ?? s.c.cas ?? ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn primary" onClick={() => run()} disabled={busy} style={{ opacity: busy ? 0.7 : 1, minWidth: 96 }}>
          {busy ? "Resolving…" : "Resolve"}
        </button>
      </div>
      {note ? (
        <span style={{ fontSize: 12, lineHeight: 1.45, color: note.kind === "ok" ? "var(--recovered)" : "var(--uncertain)" }}>{note.text}</span>
      ) : (
        <span className="faint" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
          Maps any identifier to the one salt-form-correct benchmark record (DTXSID-first), then grades it on the {dz} axis. This is identity resolution over the curated ground truth — not open-ended assessment of arbitrary chemicals.
        </span>
      )}
    </div>
  );
}

function Selector(props: { cfg: (typeof AXIS)[Disease]; activeId: string; onSelect: (id: string) => void }) {
  const Group = ({ title, ids, tone }: { title: string; ids: string[]; tone: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span className="mono faint" style={{ fontSize: 11.5, letterSpacing: "0.04em", width: 170 }}>{title}</span>
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
      <Group title={props.cfg.knownLabel} ids={props.cfg.known} tone="var(--recovered)" />
      <Group title={props.cfg.decoyLabel} ids={props.cfg.decoys} tone="var(--reject)" />
    </div>
  );
}

function Readout({ result, onSwitchDisease }: { result: CompoundResult; onSwitchDisease: (d: Disease) => void }) {
  const positive = result.recovery.call === "positive";
  const tone = positive ? "var(--recovered)" : "var(--reject)";
  const cross = result.crossDisease ?? [];
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
          {result.compound.dtxsid || "identity pending"} / tier: {result.confidenceTier}
        </div>
      </div>
      <p className="dim" style={{ fontSize: 14, flex: 1, minWidth: 280, margin: 0, color: tone, opacity: 0.95 }}>
        {result.recovery.rationale}
      </p>
      {cross.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="mono faint" style={{ fontSize: 10.5, letterSpacing: "0.05em" }}>also assessed</span>
          {cross.map((cd) => {
            const pos = cd.call === "positive";
            return (
              <button
                key={cd.disease}
                onClick={() => onSwitchDisease(cd.disease)}
                className={`chip ${pos ? "recovered" : "reject"}`}
                title={cd.rationale ?? ""}
                style={{ cursor: "pointer" }}
              >
                <span className="dot" />{cd.label}: {pos ? "positive" : "negative"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Masthead(props: { live: boolean; theme: "dark" | "light"; onToggle: () => void; onTour: () => void }) {
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
      <Link to="/" style={{ display: "flex", alignItems: "baseline", gap: 14, textDecoration: "none", color: "inherit" }}>
        <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 18 }}>Aitiome</span>
        <span className="mono faint" style={{ fontSize: 12 }}>exposome / neurodegeneration</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="masthead-nav"><SiteNav compact /></div>
        <span className={`chip ${props.live ? "recovered" : "signal"}`}>
          <span className="dot" />{props.live ? "engine live" : "fixtures"}
        </span>
        <button className="btn primary" onClick={props.onTour} title="A guided path through the thesis">&#9654; Guided tour</button>
        <button className="btn" onClick={props.onToggle}>{props.theme === "dark" ? "Light" : "Dark"}</button>
      </div>
    </header>
  );
}

function Scoreboard(props: { recovered: string; rejected: string; decoys: string; errors: number; recoveredLabel: string; decoyLabel: string }) {
  const items = [
    { num: props.recovered, lab: props.recoveredLabel, tone: "var(--recovered)" },
    { num: props.rejected, lab: "negatives correctly rejected", tone: "var(--ink)" },
    { num: props.decoys, lab: props.decoyLabel, tone: "var(--reject)" },
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

