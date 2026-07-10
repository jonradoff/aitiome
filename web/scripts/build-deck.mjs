// Builds the Aitiome presentation as a 16:9 PDF, on-brand (embedded fonts + hero
// screenshot). Renders via the system Chrome. Output: docs/aitiome-presentation.pdf
//
// Arc (self-contained for a general hackathon audience): problem -> the hard part
// -> the original goal -> the pivot -> what it is -> the recovery rule -> the hero
// -> results -> [live product: the assessment] -> [live product: specificity] ->
// falsification -> circularity -> [live product: it's all computed live] -> the
// discovery map -> [live product: sources] -> [live product: MCP] -> the full-stack
// Claude architecture -> how it's built -> challenges & learnings -> takeaways ->
// limitations/next -> close. The [live product] slides are annotated real
// screenshots (see web/scripts/capture-deck-shots.mjs) so the claims are shown,
// not just asserted.
import puppeteer from "puppeteer-core";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");
const b64 = (p) => readFileSync(p).toString("base64");

const grotesk = b64(join(dir, "../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2"));
const mono = b64(join(dir, "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2"));
const hero = b64("/tmp/deck-hero-rotenone.png");

const FAVICON = readFileSync(join(dir, "../public/favicon.svg"), "utf8");
const shotB64 = (name) => b64(`/tmp/deck-app-${name}.png`);

// --- slide helpers ---
const slides = [];
const slide = (cls, inner) => slides.push(`<section class="slide ${cls || ""}">${inner}</section>`);
const eyebrow = (t) => `<div class="eyebrow">${t}</div>`;
const h = (t) => `<h1>${t}</h1>`;
const foot = (n) => `<div class="foot"><span>Aitiome</span><span class="mono">aitiome.fly.dev</span><span>${n}</span></div>`;

let n = 0;
const N = () => String(++n).padStart(2, "0");

// An annotated product-tour slide: a real, framed app screenshot with numbered
// callout pins overlaid and a matching numbered legend below.
function shotSlide(name, eyebrowText, title, callouts) {
  const img = shotB64(name);
  const pins = callouts.map((c) => `<span class="pin ${c.tone || "c"}" style="left:${c.x}%;top:${c.y}%">${c.n}</span>`).join("");
  const legend = callouts.map((c) => `<div class="lg"><span class="pin sm ${c.tone || "c"}">${c.n}</span><span>${c.label}</span></div>`).join("");
  slide("shotslide", `${eyebrow(eyebrowText)}<h1 class="shoth">${title}</h1>
    <div class="shotwrap"><div class="shot"><img src="data:image/png;base64,${img}"/>${pins}</div></div>
    <div class="legend">${legend}</div>${foot(N())}`);
}

// 1 - title
slide("title", `
  <div class="mark">${FAVICON}</div>
  <h1 class="big">Aitiome</h1>
  <p class="lede">A mechanistic reasoning engine for the environmental exposome of neurodegeneration.</p>
  <p class="tag mono">It recovers the real ones, resolves to the real neurons, and isn't fooled by the imposters.</p>
  <div class="urls mono"><span>aitiome.fly.dev</span><span class="dot">/</span><span>Built with Claude: Life Sciences</span></div>
  ${foot(N())}`);

// 2 - the problem (context)
slide("", `${eyebrow("The problem")}${h("What causes sporadic Parkinson's and Alzheimer's?")}
  <div class="cols">
    <p>The large majority of Parkinson's and Alzheimer's is <b>sporadic</b> - not inherited. The
    leading suspect for the rest is the <b>environmental exposome</b>: the pesticides, metals, and
    industrial chemicals we're exposed to over a lifetime. In 2024 the field's leaders (Miller,
    Barouki, Samieri; <i>Nature Neuroscience</i>) called for AI that connects chemicals to
    disease <i>mechanism</i>.</p>
    <p class="dim">Which chemicals actually drive neurodegeneration, and through what biological
    pathway? That is the open question this project takes on.</p>
  </div>${foot(N())}`);

// 3 - the hard part
slide("dark", `${eyebrow("Why it's hard")}${h("Bioactive is not the same as neurotoxic")}
  <div class="cols">
    <p>Tens of thousands of chemicals are <b>bioactive</b> - they light up assays. Almost none of
    them cause neurodegeneration. The entire difficulty is telling a true neurotoxicant apart from a
    compound that is merely bioactive.</p>
    <p class="dim">This is the exact failure mode of activity-based screening: it flags everything
    that <i>does something</i>. Beat that, and you have something real. Fail it, and you have a
    watchlist no scientist can trust.</p>
  </div>
  <p class="pull">The whole project is built to win that one discrimination.</p>
  ${foot(N())}`);

// 4 - the original goal
slide("", `${eyebrow("What we set out to build")}${h("A discovery engine for novel drivers")}
  <div class="cols">
    <p>The original pitch: an AI that scans the environmental chemical universe and surfaces
    <i>novel</i> candidate drivers of neurodegeneration, validated by recovering the known
    neurotoxicants.</p>
    <p class="dim">Before writing code, we did a multi-round data reconnaissance to check whether
    that was actually possible on public data. It changed the project - and that is the interesting
    part.</p>
  </div>${foot(N())}`);

// 5 - the pivot
slide("", `${eyebrow("The evidence-driven pivot")}${h("The evidence redirected us")}
  <div class="two">
    <div class="card"><div class="k mono">Finding 1</div><p>No shippable unsupervised-discovery
    signal exists for this chemical class on public data. Seven independent axes tested; all
    coverage-killed or confounder-killed.</p></div>
    <div class="card"><div class="k mono">Finding 2</div><p>The discriminating signal is
    <b>curated mechanism</b>, not assay activity. Bioactivity scores <b>worse than chance</b> against
    the decoys.</p></div>
  </div>
  <p class="pull">So we built the thing the data supports - and made that discipline the contribution.</p>
  ${foot(N())}`);

// 6 - what it is (goals)
slide("", `${eyebrow("What Aitiome is")}${h("Three co-equal goals")}
  <div class="three">
    <div class="card"><div class="num c">01</div><b>Validation that works</b><p class="dim">Recover the known neurotoxicants on the endorsed pathway; reject the adversarial decoys.</p></div>
    <div class="card"><div class="num g">02</div><b>A signature visualization</b><p class="dim">The recovery-and-specificity reveal resolving into the vulnerable dopaminergic neurons.</p></div>
    <div class="card"><div class="num c">03</div><b>Calibrated framing</b><p class="dim">Confidence tiers on every result; the discovery limits shown, not hidden.</p></div>
  </div>${foot(N())}`);

// 7 - recovery rule
slide("", `${eyebrow("The core discipline")}${h("The recovery rule")}
  <div class="rule mono">positive &nbsp;&#8660;&nbsp; ( CTD curated Parkinson's DirectEvidence ) &nbsp;OR&nbsp; ( registered neuro-AOP stressor )</div>
  <div class="two">
    <div><b class="c">Curated signals are diagnostic.</b><p class="dim">Two independent curation efforts. A fixed logical rule, no fitted parameters to overfit.</p></div>
    <div><b class="r">Assay activity is corroboration only.</b><p class="dim">Anti-diagnostic here - the engine <b>never</b> gates a positive call on bioactivity.</p></div>
  </div>${foot(N())}`);

// 8 - hero (visual on top, text below - no label/title collision)
slide("herofull", `
  <div class="herowrap"><img src="data:image/png;base64,${hero}"/></div>
  <div class="herobody">
    ${eyebrow("The signature visual")}
    <h1>The endorsed cascade, grounded, resolving into the vulnerable neurons</h1>
    <p class="mono small">MIE complex-I inhibition &#8594; mitochondrial dysfunction &#8594; nigrostriatal dopaminergic degeneration &#8594; parkinsonian deficits. Grounded in MitoCarta Complex-I subunits and the Kamath SOX6/AGTR1 vulnerable dopaminergic neurons.</p>
  </div>${foot(N())}`);

// 9 - results
slide("dark", `${eyebrow("The result, on the reconnaissance ground truth")}${h("Zero errors")}
  <div class="score">
    <div><div class="n c">13/13</div><div class="l">known neurotoxicants recovered</div></div>
    <div><div class="n">15/15</div><div class="l">negatives correctly rejected</div></div>
    <div><div class="n r">6/6</div><div class="l">bioactive decoys not fooled</div></div>
    <div><div class="n c">0</div><div class="l">false positives + false negatives</div></div>
  </div>
  <p class="dim center">13 Parkinson's positives (6 assay-recovered + 7 curated-anchored, incl. trichloroethylene / Camp Lejeune) - 15 negatives, including 6 mitochondria-active adversarial decoys built to fool an activity model.</p>
  ${foot(N())}`);

// 10 - product: the live assessment (convergent evidence + reasoning trace)
shotSlide("readout", "The live product - one resolve, the whole assessment", "Convergent evidence, and the pathway reconstructed", [
  { n: 1, x: 15, y: 14, tone: "c", label: "Five convergent evidence strands, each with provenance" },
  { n: 2, x: 15, y: 41, tone: "r", label: "Assay activity is corroboration only - never a discriminator" },
  { n: 3, x: 74, y: 14, tone: "c", label: "The endorsed AOP, reconstructed edge by edge" },
]);

// 11 - product: specificity (the real screenshot)
shotSlide("specificity", "The specificity centerpiece, live", "It is not fooled by the imposters", [
  { n: 1, x: 33, y: 27, tone: "g", label: "Pick any bioactive decoy" },
  { n: 2, x: 18, y: 40, tone: "r", label: "What lights up an activity-based model" },
  { n: 3, x: 82, y: 30, tone: "c", label: "Rejected on three independent lines at once" },
]);

// 11 - falsification
slide("dark", `${eyebrow("The falsification - computed live from our own data")}${h("Why not just use bioactivity?")}
  <p class="dim">If activity could do the job, some signal would separate the 13 positives from the 6 decoys. None does - every one is at or below chance (0.5).</p>
  <div class="bars">
    ${bar("Mitochondrial assays", 0.16)}
    ${bar("Membrane potential (MMP)", 0.12)}
    ${bar("Oxidative stress", 0.20)}
    ${bar("Mechanistic assays (total)", 0.39)}
    ${bar("ToxCast active (all)", 0.15)}
  </div>
  <p class="dim">Curated rule on the same set: <b class="c">perfect (0 errors)</b>. The decoys are, if anything, more bioactive than the real neurotoxicants.</p>
  <p class="dim small">Prior chemical-disease ML reports 90%+ AUROC - but on drug-keyed, well-covered space, never adversarial environmental decoys. ToxCast covers only ~40% neural-relevant targets (Mack 2024): the structural reason activity fails here.</p>
  ${foot(N())}`);

// 12 - circularity
slide("", `${eyebrow("Answering the sharpest critique, empirically")}${h("Is it circular? Two independent curations converge")}
  <div class="score3">
    <div><div class="n">9/13</div><div class="l">CTD DirectEvidence alone</div></div>
    <div class="op">+</div>
    <div><div class="n">8/13</div><div class="l">AOP-Wiki stressor alone</div></div>
    <div class="op">&#8594;</div>
    <div><div class="n c">13/13</div><div class="l">the rule (CTD or AOP)</div></div>
  </div>
  <p class="dim center">CTD (toxicogenomics literature) and AOP-Wiki (OECD regulatory) are independent efforts; neither alone suffices, so this is not one source read twice. Both are <b>0/15</b> false-positives. And the decoys were selected for bioactivity, not curation status - so rejecting them is not baked in.</p>
  ${foot(N())}`);

// 12b - product: the falsification + circularity, computed live in the app
shotSlide("falsification", "Not a slide - computed live from our own data", "The whole argument, running in the product", [
  { n: 1, x: 12, y: 34, tone: "c", label: "Curated rule: zero errors on the set" },
  { n: 2, x: 60, y: 27, tone: "r", label: "Every bioactivity signal at or below chance" },
  { n: 3, x: 30, y: 74, tone: "c", label: "Circularity answered: two independent curations converge" },
]);

// 13 - discovery map
slide("", `${eyebrow("The limits, mapped")}${h("Where AI-driven discovery works, and where it does not")}
  <div class="grid7">
    ${axis("LINCS L1000", "coverage-killed")}
    ${axis("EPA HTTr", "coverage-killed")}
    ${axis("EPA HTPP", "coverage-killed")}
    ${axis("Structure / QSAR", "confounder-killed")}
    ${axis("ToxCast fingerprint", "confounder-killed")}
    ${axis("ComptoxAI / AlzKB", "coverage-killed")}
    ${axis("Neural-specific subset", "qualified lead", true)}
    ${axis("Boltz-2 Q-site", "conditional lead", true)}
  </div>
  <p class="dim">Seven axes coverage- or confounder-killed. Two unproven leads remain (reported with explicit N). Discovery is a map, never a predictor.</p>
  ${foot(N())}`);

// 13a - the candidate pipeline (the honest form of the original discovery goal)
slide("", `${eyebrow("The honest form of the original goal")}${h("Discovery, done honestly: a triage queue")}
  <div class="two">
    <div class="card"><div class="k mono">Validator &#8594; pipeline</div><p>The original pitch was discovery. Its honest form is a <b>triage queue</b>, not a predictor: chemicals with real but incomplete evidence, ranked by an <b>evidence-weighted priority</b> built only on non-bioactivity strands. Each carries a distance-to-gate and a <b>recommended next experiment</b> for a wet lab.</p></div>
    <div class="card recovered"><div class="k mono">The discipline, kept</div><p>The ranking never decides - <b>only the curated gate promotes</b>. The six adversarial decoys are carried as a permanent control and <b>rank last (0)</b>. A <b>held-out backtest</b> recovers a known positive (TCE / DDE) from non-curated evidence alone, above every decoy: prioritization skill, not causal discovery.</p></div>
  </div>
  ${foot(N())}`);

// 13a2 - product: the candidate queue, live
shotSlide("candidates", "The candidate pipeline, live", "A ranked queue that tells a lab what to test next", [
  { n: 1, x: 22, y: 21, tone: "g", label: "Held-out backtest: a known positive recovered from non-curated evidence, above every decoy" },
  { n: 2, x: 87, y: 41, tone: "c", label: "Evidence-weighted priority - gate-ready AOP stressors rank top" },
  { n: 3, x: 33, y: 59, tone: "c", label: "Each candidate: distance-to-gate + the recommended next experiment" },
]);

// 13d - second axis: Alzheimer's
slide("", `${eyebrow("A second axis, the same discipline")}${h("Alzheimer's — calibrated below Parkinson's")}
  <div class="two">
    <div class="card"><div class="k mono">The AD arm</div><p>The identical curated-diagnostic engine, anchored on the <b>endorsed AOP-12/48</b> (aging neurodegeneration + memory; registered stressor: lead) with a non-endorsed Tau/amyloid overlay. Recovers curated AD-linked chemicals (DDE, cadmium, lead), rejects the imposters, and resolves into disease-associated microglia (TREM2/APOE).</p></div>
    <div class="card recovered"><div class="k mono">The decoys are the treatments</div><p>The compounds most active on AD assays are the anti-amyloid <b>drugs</b> (donepezil, methylene blue) and dietary <b>polyphenols</b> (curcumin, EGCG). An activity model would flag the cure. Aitiome does not - no curated causation.</p></div>
  </div>
  <p class="pull">Same rigor; confidence calibrated to the evidence.</p>
  ${foot(N())}`);

// 13e - the two axes compared
slide("dark", `${eyebrow("The two axes, compared")}${h("The same method, calibrated to the evidence.")}
  <div class="cmp">
    <div class="cmphead"><div class="cmpd mono faint">dimension</div><div class="cmpc"><b class="c">Parkinson's</b></div><div class="cmpc"><b class="g">Alzheimer's</b></div></div>
    ${cmp("Scaffold (OECD)", "AOP-3 endorsed; EFSA-expanding complex I-IV family", 3, "AOP-12/48 endorsed + non-endorsed overlay", 2)}
    ${cmp("Curated recovery", "13/13, 0 err", 3, "12/12, 0 err", 3)}
    ${cmp("Predictive power / falsification", "quantified: activity at or below chance", 3, "qualitative; assay-AUROC pending data", 1)}
    ${cmp("Circularity defense", "two curations converge (9/13 + 8/13)", 3, "leans on CTD alone (~11/12)", 1)}
    ${cmp("Human epidemiology", "quantified (paraquat 2.5x, rotenone OR ~10)", 3, "DDE OR 4.18; aluminum contested", 2)}
  </div>
  <p class="dim small">Shared: KE-188 neuroinflammation bridges both AOPs; lead is positive for both; mitochondrial dysfunction is an unlinked gap, shown not hidden.</p>
  ${foot(N())}`);

// 13f - positioning vs prior art (empirical; the AI-approach contrast with PROTON)
slide("dark", `${eyebrow("Where we sit, measured")}${h("Prioritization is prior art. The AI approach is ours.")}
  <div class="two">
    <div class="card"><b class="c">PROTON's AI vs ours</b><p class="dim">PROTON (2025) is a learned model whose prediction is the output. Aitiome inverts the role of AI: Claude reconstructs the pathway and grades the evidence, but a <b>curated gate, not the model, makes the call.</b></p></div>
    <div class="card recovered"><b class="g">What the data shows</b><p class="dim">PROTON shares our no-bioactivity discipline and <b>converges</b> - endosulfan, dicofol and naled (its held-out top pesticides) are all in our PD queue. ENRICH uses bioactivity and <b>diverges</b> - 0 of our 43 reach its top-250, and it ranks our decoy propiconazole #6.</p></div>
  </div>
  <p class="dim center">The queue is prior art (ToxPi, IATA, ENRICH, PROTON). The bundle is ours: bioactivity excluded on evidentiary grounds, a transparent index, ranking separate from a curated gate, decoys as a live control.</p>
  ${foot(N())}`);

// 13f2 - convergence with the mechanistic literature
slide("", `${eyebrow("Grounded in established mechanism")}${h("Convergent with the mechanistic literature, node by node")}
  <div class="two">
    <div class="card"><b class="c">Parkinson's spine</b><p class="dim">The mitochondrial-dysfunction &#8594; dopaminergic-degeneration edge we reconstruct is the <b>Nakamura</b> lab's own work (Berthet 2014; CHCHD2, Sci Adv 2025); the parkinsonian-deficit outcome is the <b>Kreitzer</b> lab's basal-ganglia circuit (Kravitz 2010, Nature).</p></div>
    <div class="card recovered"><b class="g">Alzheimer's arm</b><p class="dim">Our neuroinflammation + BBB node is <b>Akassoglou's</b> fibrin&#8594;microglia mechanism (Merlini 2019; Mendiola 2023); the APOE&#8594;microglia node is <b>Huang's</b> APOE4 work (2024-25); TREM2&#8594;network is <b>Mucke</b> (Das 2021).</p></div>
  </div>
  <p class="pull">The field owns the endogenous mechanism; Aitiome adds the exposome layer.</p>
  <p class="dim small">We also pre-empt Nakamura 2008 (complex-I not strictly required) - exactly why we never gate on activity and model paraquat via redox-cycling AOP-593.</p>
  ${foot(N())}`);

// 13g - principled exclusions
slide("dark", `${eyebrow("The exclusions are the discipline")}${h("What we deliberately do not use")}
  <div class="two">
    <ul class="list">
      <li><b>Bioactivity as a discriminator</b> (ToxCast/Tox21 hitcalls, GenRA, DeepTox) - anti-diagnostic here; ToxCast covers only ~40% neural-relevant targets (Mack 2024).</li>
      <li><b>Circular knowledge graphs</b> (ComptoxAI, AlzKB, PrimeKG, Hetionet) - edges are CTD/AOP-derived or drug-keyed.</li>
    </ul>
    <ul class="list">
      <li><b>Structure / QSAR & morphology</b> - general similarity is not neurotoxicity.</li>
      <li><b>CTD inferred associations</b> - inference by study volume (acetaminophen: 80 inferred PD links). Only curated DirectEvidence counts.</li>
    </ul>
  </div>
  <p class="dim center">Anything that smuggles general bioactivity back in, or is circular with our own curation, is disqualified.</p>
  ${foot(N())}`);

// 13b - product: sources & references (nothing is asserted uncited)
shotSlide("sources", "Auditable end to end", "Every claim links to its primary source", [
  { n: 1, x: 12, y: 21, tone: "c", label: "Nine primary sources, each a resolvable citation" },
  { n: 2, x: 40, y: 24, tone: "g", label: "Tagged by role: diagnostic, corroboration, grounding" },
]);

// 13c - product: the dual (human + agent) interface over one engine
shotSlide("mcp", "One engine, two interfaces", "A scientist and an agent query the same tools", [
  { n: 1, x: 12, y: 52, tone: "c", label: "Eight MCP tools - the same engine, exposed to agents" },
  { n: 2, x: 62, y: 52, tone: "g", label: "An agent gets the same graded, cited call" },
]);

// 14 - built on Claude (the three-layer fusion)
slide("dark", `${eyebrow("Built with Claude, end to end")}${h("Claude Code builds it. The API reasons. Claude Science verifies.")}
  <div class="three">
    <div class="card"><b class="c">Claude Code</b><p class="dim">Built the whole system - two parallel streams (engine and visualization) over a versioned contract, the deterministic core, the falsification harness, the hero, the deploy.</p></div>
    <div class="card"><b class="g">Claude API (Opus 4.8)</b><p class="dim">The in-app evidence-reasoner (explains, never decides) and a command-line curation agent that assembles curated evidence for a new chemical with web tools.</p></div>
    <div class="card"><b class="c">Claude Science</b><p class="dim">The evidence-assembly and <b>verification</b> layer: it checks a draft against the primary sources and produces a reproducible artifact, turning a hypothesis into a curated call.</p></div>
  </div>
  <p class="dim center" style="margin-top:22px">A full-stack Claude pipeline - and Claude still never enters the decision path.</p>
  ${foot(N())}`);

// 15 - architecture / beyond the benchmark
slide("", `${eyebrow("How it's built, and how it extends")}${h("Deterministic core, auditable end to end")}
  <div class="two">
    <ul class="list">
      <li>One Go binary embeds the curated data; the recovery decision is <b>deterministic</b> - no LLM in the decision path.</li>
      <li>Transport-agnostic service, thin HTTP + MCP adapters - a scientist and an external agent query the same tools.</li>
      <li>DTXSID-first, salt-form-correct identity (the paraquat-dichloride trap, tested).</li>
    </ul>
    <ul class="list">
      <li>Every claim links to the original source (CTD, AOP-Wiki, MitoCarta, Kamath, ToxCast/ICE, FAERS, B3DB).</li>
      <li><b>Beyond the 27:</b> Claude Science assembles curated evidence, <span class="mono">POST /assess-curated</span> grades it - an unverified draft is a hypothesis, never a recovery.</li>
      <li>~13 MB container, live on fly.io. Reproducible: same input, same output.</li>
    </ul>
  </div>${foot(N())}`);

// 16 - challenges & learnings
slide("", `${eyebrow("What we learned along the way")}${h("Challenges, and what they taught us")}
  <div class="two">
    <ul class="list">
      <li><b>Novelty was the wrong optimization.</b> Five prior-art scans found the whole design space already published - so we built the validated prototype the field called for, and positioned it accurately.</li>
      <li><b>Bioactivity is anti-diagnostic.</b> The deepest surprise: on our own data it scores worse than chance against the decoys. Activity cannot be the discriminator.</li>
    </ul>
    <ul class="list">
      <li><b>Identity correctness is day one.</b> The paraquat salt-form trap silently returns "no data" and corrupts everything downstream.</li>
      <li><b>Our own test harness caught our own overclaim.</b> A red-team test we wrote failed, and forced the stronger, evidence-based statement. Ground claims in executable evidence.</li>
    </ul>
  </div>${foot(N())}`);

// 17 - takeaways
slide("dark", `${eyebrow("The takeaways")}${h("What this hackathon produced")}
  <div class="three">
    <div class="card"><b class="c">Validation that holds</b><p class="dim">Recovery works (13/13 PD; 12/12 AD) and specificity is proven by falsification - bioactivity at or below chance against adversarial decoys. The discovery limits are mapped, not hidden.</p></div>
    <div class="card"><b class="g">A pipeline that guides the bench</b><p class="dim">The honest form of discovery: an evidence-weighted triage queue that ranks what to test next, gate-promoted, decoy-controlled, and validated by a held-out backtest. It converges with PROTON, diverges from bioactivity-driven ENRICH.</p></div>
    <div class="card"><b class="c">Calibrated, shipped, live</b><p class="dim">Built end to end on Claude - which reasons over the evidence but never makes the call - deterministic where it must be, cited to source, live at aitiome.fly.dev with an MCP interface for agents.</p></div>
  </div>${foot(N())}`);

// 18 - limitations
slide("", `${eyebrow("Said before you ask")}${h("Limitations and next steps")}
  <div class="two">
    <ul class="list">
      <li>A curated benchmark with an adversarial control (27), not a population generalization study.</li>
      <li>Recovery shares curated provenance with the labels - defended by the independent-source ablation and the orthogonal negatives; it is a sanity check, not the headline.</li>
      <li>Anchored on the Parkinson's / mitochondrial route; Alzheimer's is a scaffold extension.</li>
    </ul>
    <ul class="list">
      <li><b>Next:</b> a larger, blinded neural-specific reference set to power the one qualified lead (AUROC 0.72, currently perm-p 0.155).</li>
      <li><b>Next:</b> run the bounded Boltz-2 Q-site benchmark - physics, not annotation or activity.</li>
      <li><b>Next:</b> a time-dated backtest of the candidate queue (rank on pre-dated evidence; show later-curated positives surface) and automated multi-source ingestion.</li>
    </ul>
  </div>${foot(N())}`);

// 19 - close
slide("title", `
  <div class="mark">${FAVICON}</div>
  <h1 class="big2">Less flashy than the original pitch.<br/>Far more trustworthy.</h1>
  <p class="lede">Validated recovery, adversarial specificity proven by falsification, and a mapped account of the limits - for a mechanism-first audience, that is the point.</p>
  <div class="urls mono"><span>aitiome.fly.dev</span><span class="dot">/</span><span>github.com/jonradoff/aitiome</span></div>
  ${foot(N())}`);

function bar(name, v) {
  const pct = Math.round(v * 100);
  const chance = 50;
  return `<div class="barrow">
    <div class="bn">${name}</div>
    <div class="bt"><div class="bfill" style="width:${pct}%"></div><div class="bchance" style="left:${chance}%"></div></div>
    <div class="bv mono">${v.toFixed(2)}</div>
  </div>`;
}
function dots(n) {
  return [0, 1, 2].map((i) => `<span class="cd${i < n ? " on" : ""}"></span>`).join("");
}
function cmp(dim, pd, pn, ad, an) {
  return `<div class="cmpr">
    <div class="cmpd">${dim}</div>
    <div class="cmpc"><span class="dots">${dots(pn)}</span><span>${pd}</span></div>
    <div class="cmpc"><span class="dots gold">${dots(an)}</span><span>${ad}</span></div>
  </div>`;
}
function axis(name, verdict, lead) {
  const tone = lead ? "lead" : verdict.includes("confounder") ? "conf" : "cov";
  return `<div class="axis ${tone}"><div class="an">${name}</div><div class="av mono">${verdict}${lead ? " &#9679;" : ""}</div></div>`;
}

const css = `
  @font-face{font-family:'Grotesk';src:url(data:font/woff2;base64,${grotesk}) format('woff2');font-weight:300 700;}
  @font-face{font-family:'PlexMono';src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:400;}
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0c10;--bg2:#12161d;--bg3:#171c25;--line:rgba(255,255,255,.09);--ink:#e9edf3;--dim:#9fabbb;--faint:#616d7e;--c:#55d6c6;--g:#e7b168;--r:#e07a8f;--u:#d6a444}
  html,body{background:#000}
  body{font-family:'Grotesk',system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
  .mono{font-family:'PlexMono',monospace}
  .slide{width:1280px;height:720px;background:var(--bg);position:relative;padding:70px 84px;overflow:hidden;page-break-after:always;display:flex;flex-direction:column}
  .slide.dark{background:radial-gradient(120% 90% at 15% 0%,#0f151d,#080a0e 75%)}
  .eyebrow{font-family:'PlexMono';font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:var(--c);margin-bottom:26px}
  h1{font-size:44px;font-weight:600;letter-spacing:-.02em;line-height:1.08;max-width:24ch}
  .big{font-size:120px;letter-spacing:-.03em;margin:6px 0 22px}
  .big2{font-size:52px;max-width:20ch;margin-bottom:22px}
  p{font-size:20px;line-height:1.5;color:var(--ink)}
  .dim{color:var(--dim)}.faint{color:var(--faint)}.center{text-align:center}
  b.c,.c{color:var(--c)}b.r,.r{color:var(--r)}b.g,.g{color:var(--g)}
  .foot{position:absolute;left:84px;right:84px;bottom:34px;display:flex;justify-content:space-between;font-size:13px;color:var(--faint);font-family:'PlexMono'}
  /* title */
  .slide.title{justify-content:center}
  .mark{width:64px;height:64px;margin-bottom:26px}.mark svg{width:64px;height:64px;border-radius:16px}
  .lede{font-size:24px;max-width:42ch;color:var(--dim);margin-bottom:18px}
  .tag{font-size:16px;color:var(--c);margin-bottom:40px}
  .urls{display:flex;gap:16px;font-size:15px;color:var(--faint)}.urls .dot{color:var(--line)}
  /* layouts */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:34px}
  .three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:34px}
  .card{background:linear-gradient(180deg,var(--bg2),var(--bg));border:1px solid var(--line);border-radius:14px;padding:26px}
  .card .k{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);margin-bottom:12px}
  .card .num{font-family:'PlexMono';font-size:30px;margin-bottom:10px}
  .card b{font-size:20px;display:block;margin-bottom:8px}
  .card.recovered{border-color:color-mix(in srgb,var(--c) 40%,transparent)}
  .card.uncertain{border-color:color-mix(in srgb,var(--u) 40%,transparent)}
  .pull{margin-top:34px;font-size:24px;color:var(--c)}
  .rule{margin:38px 0 10px;font-size:22px;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:26px 24px;color:var(--ink);text-align:center}
  .list{list-style:none;display:flex;flex-direction:column;gap:16px}
  .list li{font-size:17px;line-height:1.45;color:var(--dim);padding-left:20px;position:relative}
  .list li::before{content:"";position:absolute;left:0;top:9px;width:7px;height:7px;border-radius:99px;background:var(--c)}
  .list li b{color:var(--ink)}
  /* scoreboard */
  .score{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:38px 0 26px}
  .score>div{padding:38px 26px;border-left:1px solid var(--line)}.score>div:first-child{border-left:none}
  .score .n{font-family:'PlexMono';font-size:50px;font-weight:500;line-height:1}
  .score .l{font-size:14px;color:var(--faint);margin-top:10px}
  .score3{display:flex;align-items:center;gap:28px;justify-content:center;margin:46px 0 30px}
  .score3 .n{font-family:'PlexMono';font-size:52px}.score3 .l{font-size:14px;color:var(--faint);margin-top:8px;text-align:center}
  .score3 .op{font-size:34px;color:var(--faint)}
  /* bars */
  .bars{display:flex;flex-direction:column;gap:16px;margin:30px 0}
  .barrow{display:grid;grid-template-columns:280px 1fr 60px;align-items:center;gap:18px}
  .bn{font-size:17px}.bv{font-size:17px;color:var(--u);text-align:right}
  .bt{position:relative;height:12px;background:var(--bg3);border-radius:8px;overflow:visible}
  .bfill{height:100%;background:var(--u);border-radius:8px;opacity:.85}
  .bchance{position:absolute;top:-5px;bottom:-5px;width:2px;background:var(--faint)}
  /* discovery */
  .grid7{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:30px 0}
  .axis{border:1px solid var(--line);border-radius:12px;padding:18px}
  .axis .an{font-size:16px;font-weight:500;margin-bottom:8px}
  .axis .av{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint)}
  .axis.conf .av{color:var(--u)}.axis.lead{border-color:color-mix(in srgb,var(--c) 40%,transparent)}.axis.lead .av{color:var(--c)}
  /* hero: visual band on top, text below */
  .slide.herofull{padding:0}
  .herofull .herowrap{height:430px;overflow:hidden;border-bottom:1px solid var(--line);background:#090b0f}
  .herofull .herowrap img{width:100%;height:100%;object-fit:cover;object-position:center 45%}
  .herofull .herobody{padding:34px 84px 0}
  .herofull h1{max-width:32ch;font-size:38px}
  .small{font-size:15px;color:var(--dim);margin-top:14px;max-width:86ch}
  /* compare matrix */
  .cmp{border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:26px 0 16px}
  .cmphead,.cmpr{display:grid;grid-template-columns:1.15fr 1.3fr 1.3fr}
  .cmphead{background:var(--bg2)}
  .cmpr{border-top:1px solid var(--line)}
  .cmpd{padding:13px 18px;font-size:15px;font-weight:500;border-right:1px solid var(--line);display:flex;align-items:center}
  .cmphead .cmpd{color:var(--faint)}
  .cmpc{padding:13px 18px;font-size:14px;color:var(--dim);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:7px}
  .cmpc:last-child{border-right:none}
  .dots{display:flex;gap:4px}
  .cd{width:8px;height:8px;border-radius:99px;background:var(--line)}
  .cd.on{background:var(--c)}.dots.gold .cd.on{background:var(--g)}
  /* annotated product-tour slides */
  .slide.shotslide{padding:40px 56px 24px}
  .shotslide .eyebrow{margin-bottom:12px}
  .shoth{font-size:29px;max-width:36ch;margin-bottom:0}
  .shotwrap{flex:1;display:flex;align-items:center;justify-content:center;margin:14px 0 12px;min-height:0}
  .shot{position:relative;display:inline-block;border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.55)}
  .shot img{display:block;max-height:430px;width:auto}
  /* on product slides the legend owns the bottom band - keep only the page number */
  .slide.shotslide .foot{justify-content:flex-end}
  .slide.shotslide .foot span:nth-child(1),
  .slide.shotslide .foot span:nth-child(2){display:none}
  .pin{position:absolute;transform:translate(-50%,-50%);width:27px;height:27px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-family:'PlexMono';font-size:14px;font-weight:600;color:#08110f;background:var(--c);box-shadow:0 0 0 3px rgba(8,10,14,.65),0 2px 10px rgba(0,0,0,.5)}
  .pin.g{background:var(--g)}.pin.r{background:var(--r);color:#fff}
  .pin.sm{position:static;transform:none;width:22px;height:22px;font-size:12px;flex:none}
  .legend{display:flex;gap:30px;justify-content:center;flex-wrap:wrap;padding:0 20px}
  .lg{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--dim);max-width:34ch}
  .lg span:last-child{line-height:1.32}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${slides.join("")}</body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, userDataDir: `/tmp/aitiome-deck-${process.pid}`,
  args: ["--no-sandbox", "--no-first-run", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => { await document.fonts.ready; });
const out = join(root, "docs/aitiome-presentation.pdf");
await page.pdf({ path: out, width: "1280px", height: "720px", printBackground: true, pageRanges: `1-${slides.length}` });
console.log("wrote", out, `(${slides.length} slides)`);
await browser.close();
