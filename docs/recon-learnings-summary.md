# Aitiome — What We Learned: Recon & Analysis Summary

*Reference for the presentation — the arc from original goal to final design, why it changed, and every resource investigated with technical and scientific findings. The drift is not a retreat; it's the record of letting evidence redirect the project toward something more credible.*

---

## 1. Executive summary

We set out to build a **discovery engine**: an AI that scans the environmental chemical universe and surfaces *novel* candidate drivers of Alzheimer's and Parkinson's, validated by recovering known neurotoxicants. Rigorous, multi-round data reconnaissance changed the shape of that goal in two decisive ways:

1. **There is no shippable unsupervised-discovery signal for this compound class on public data.** We tested seven independent discovery axes; all were either *coverage-killed* (environmental chemicals aren't profiled in the relevant databases) or *confounder-killed* (general bioactivity is not neurotoxicity). This is a robust, reproducible negative result — and mapping it is itself a contribution.
2. **The honest, validated version of the project is stronger for the actual goal** (credibility and renown in applying AI to science) than an overclaimed discovery watchlist would have been.

So Aitiome became an **honest mechanistic-reasoning engine**: it reconstructs endorsed mechanistic pathways for known neurotoxicants, proves specificity by correctly *rejecting* bioactive-but-non-neurotoxic decoys (now corroborated by three independent evidence lines), integrates a convergent multi-strand evidence model, and ships a transparent map of exactly where AI-driven discovery is and isn't possible. Discovery was demoted from headline claim to honestly-hedged leads plus that map.

---

## 2. How the goals evolved

| Dimension | Original goal / method | Adjusted goal / method | Why it changed |
|---|---|---|---|
| **Core claim** | AI *discovers* novel environmental drivers of neurodegeneration (ranked watchlist as headline) | AI *reconstructs and validates* mechanism honestly; discovery demoted to hedged leads + a negative-results map | No annotation-independent discovery signal exists for this class; and novelty isn't what wins a hackathon — execution + honest, validated demo is |
| **Basis of "recovery"** | Engine independently recovers mechanism from **assay data** | Recovery decision rides on **curated convergence** (CTD DirectEvidence OR neuro-AOP stressor); assay is corroboration only | Assay/bioactivity is *anti-diagnostic* — it scores worse than chance against the decoys |
| **The "wow"** | A striking novel-driver watchlist | Validated recovery + **triple-independent decoy rejection** + the vulnerable-neuron terminal visual | An honest, defensible wow beats an overclaimed one with mechanism-obsessed judges |
| **Novelty stance** | Find an idea no one has done | Build openly on the field's own published roadmap (Miller/Barouki et al.), positioned honestly | Five prior-art scans showed the whole design space is actively published; novelty is the wrong axis |
| **Evidence model** | Single mechanistic pathway from tox data | **Convergent multi-strand model** (curated mechanism, assay, cell-type/mito grounding, pharmacovigilance, epidemiology, brain-exposure) | Enrichment axes succeeded where discovery failed; they deepen credibility, especially on the negatives |
| **Build approach** | Bespoke reconstruction of everything | Build **on Claude Science**; DSSTox-first identifier correctness; curated-anchored | Fit (use the featured product) + correctness lessons (the salt-form trap) |
| **Failure handling** | (implicit) hide gaps | Surface the negative-results map as a **feature** | Calibrated honesty is the credibility signal these judges reward |

---

## 3. Key learnings (the load-bearing discoveries)

**Novelty is the wrong optimization for a hackathon.** Five deep prior-art scans returned occupied territory every time — the exposome→neurodegeneration program (Miller, Barouki, Samieri; *Nat Neurosci* 2024), mechanistic-tox LLM benchmarks (ToxReason), agentic tox tooling (ToxMCP, AOP-Smart), multi-agent scientific critique (Google Co-Scientist, *Nature*), and curated disease maps (AlzPathway). The lesson: hackathons are won on execution, a validated result, and story — not concept novelty. Prior art became an *asset* (validated importance, ground truth, honest positioning) rather than a threat.

**The discriminating signal is curated, not mechanistic-assay.** The zero-error recovery predicate is `(CTD curated Parkinson's DirectEvidence) OR (registered neuro-AOP stressor)` — both curated. Assay activity cannot discriminate; mitochondrial activity is actively *anti-diagnostic* (the decoys hit the same assays), and there is no dopaminergic-specific assay signal in the positives. Implication baked into the build: **never gate a positive call on assay/bioactivity activity.**

**Unsupervised discovery fails on this compound class — in two distinct ways.** *Coverage failures* (L1000, HTTr, HTPP): the environmental toxicants — pesticides, metals, MPTP/MPP+ — simply aren't in the transcriptomic/morphological profiling databases, which are drug-centric. *Confounder failures* (structure/QSAR, full ToxCast fingerprint): universal or native coverage, but no signal that survives — the confound is *general bioactivity*, not merely cytotoxicity (excluding viability assays barely helped). This is the crux, and it's robust.

**Enrichment succeeded where discovery failed.** The same evidence-integration lens that can't *discover* can richly *ground and corroborate*. Cell-type/mitochondrial grounding, real-world pharmacovigilance (FAERS), human epidemiology, and brain-exposure plausibility all added orthogonal, low-effort evidence tiers — and two of them independently hardened the hardest part of the demo (the negatives).

**The negatives story is now triple-independent.** The decoys are rejected by curated convergence **and** by brain-exposure (3/6 are non-penetrant or P-gp-effluxed) **and** by pharmacovigilance (0/4 assessable show any parkinsonism signal across ~20M FAERS reports). Three converging lines is the single most credible specificity demonstration in the project.

**Meta-lessons in method.** Coverage-triage-first recon (fail fast at the coverage gate, never fabricate numbers on underpowered data) turned what could have been days of wasted compute into cheap, clean verdicts. And recognizing the "novelty treadmill" — the pull to keep hunting for a discovery signal past the point of diminishing returns — let us stop at the mapped boundary and build the strong, honest project instead.

---

## 4. Resource investigation table

Roles in the final design: **CORE** (in the shipped engine), **ADOPT** (enrichment folded in), **SUPPORTING/LEAD** (secondary or deferred), **NO-GO / SKIP** (investigated and set aside, with reason).

### Mechanism & validation core

| Resource | What it is | Technical finding | Scientific utility for Aitiome | Role |
|---|---|---|---|---|
| **AOP-Wiki** | OECD adverse outcome pathways | RDF/SPARQL; 9 endorsed neuro AOPs exported; AOP-3 full chain complete (MIE 888→…→parkinsonian) | The mechanistic scaffold and endorsement backbone; anchors pathway reconstruction | CORE (scaffold) |
| **EPA ToxCast/Tox21** (via NICEATM **ICE**) | In-vitro assay bioactivity | Key-free via ICE; working host `comptox.epa.gov/ctx-api`; ~6/12 positives with ≥20 active assays | Illustrates/corroborates mechanism for known positives — but **anti-diagnostic** for discrimination | CORE (corroboration only; never a gate) |
| **CTD** (Comparative Toxicogenomics DB) | Curated chemical–gene–disease | Bulk CSV; curated `DirectEvidence` is signal, **inferred associations are noise** (acetaminophen: 80 inferred PD links) | Curated PD DirectEvidence = a diagnostic recovery signal | CORE (diagnostic) |
| **NeurotoxKb** | Neurotoxicity knowledge base | Coverage 7/12 positives | Redundant confirming vote in the recovery predicate | SUPPORTING |
| **PubChem / DSSTox** | Chemical identity resolution | PUG-REST; **DSSTox/DTXSID required for correct salt form** (paraquat-dichloride trap — synonym guessing picks wrong forms) | Correctness spine; wrong identity silently corrupts everything downstream | CORE (DSSTox-first resolver) |

### Discovery axes — all investigated, none shippable

| Resource / axis | What it is | Technical finding | Scientific utility | Verdict |
|---|---|---|---|---|
| **LINCS L1000** | Transcriptomic signatures (~8.5k drugs) | Coverage 3/12 positives; drug/tool-compound library; 2 covered are same-scaffold rotenoids | Annotation-independent MoA — but wrong chemical universe | NO-GO (coverage) |
| **EPA HTTr** | Whole-transcriptome (TempO-Seq) on ToxCast | Coverage 4/12; non-neuronal cells (MCF7/U-2 OS) | Right chemical class but sparse for our positives; non-neuronal; cytotox confound | NO-GO (coverage) |
| **EPA HTPP** (Cell Painting) | Morphological profiling on ToxCast | Coverage 4/12; non-neuronal | Same as HTTr; visually rich but underpowered here | NO-GO (coverage) |
| **Structure / QSAR** | Molecular-fingerprint similarity | Coverage 12/12; blind-recovery **AUROC 0.47 (chance)** | Positives share a *mechanism class, not a scaffold*; only trivial analog pairs hit | NO-GO (no signal) |
| **Full ToxCast fingerprint** | Multi-assay bioactivity profile similarity | Separates positives from *inert* (0.76) but **collapses vs. adversarials (0.53→0.56)** after cytotox control | The confound is **general bioactivity**, not just cytotoxicity — the deepest negative result | NO-GO (confounder) |
| **ComptoxAI + Alzheimer's KB** | Toxicology knowledge graph + link prediction | Public graph empty, ML layer stub code | Also **circular** — edges are CTD/AOP-derived, same provenance as our recovery predicate | NO-GO (empty + circular) |
| **Neural-specific assay subset** (DNT-IVB + nervous-system ToxCast) | Neuronal-context functional assays | Coverage 7/12; excluding viability *improves* separation (0.51→**0.72**) but **underpowered** (perm-p 0.155, CI includes chance) | Directionally right — the one axis that partly held — but developmental ≠ adult neurodegeneration | QUALIFIED LEAD (underpowered) |
| **Boltz-2 target engagement** | Physics-based binding to AOP-3 MIE (Complex I) | Feasibility GO; needs ~48 GB GPU; **not run**; prepped to one step (5XTD Q-site ND1/NDUFS2/NDUFS7 + 19-ligand benchmark) | The only basis that's neither annotation nor bioactivity — physics. Untested but honest | CONDITIONAL LEAD (deferred) |
| **PrimeKG / Hetionet** | Populated biomedical knowledge graphs | 4M+ relationships, downloadable — but only **~1/12 environmental positives** are nodes (DrugBank-keyed) | Rich for drugs, poor for our class; CTD+AOP-Wiki already ground all 12 better | SKIP (drug-skewed) |

### Enrichment tiers — the convergent evidence model (adopted)

| Resource | What it is | Technical finding | Scientific utility | Role |
|---|---|---|---|---|
| **MitoCarta3.0 + brain single-cell atlases** (Kamath, Bryois) | Mitochondrial gene inventory + SN dopaminergic-neuron atlases | MitoCarta gives all 6 Complex-I Q-site subunits; Kamath SOX6/AGTR1 vulnerable DA neurons; low effort | Grounds the MIE (gene-level) and the adverse outcome (cell type); PD→DA-mito vs AD→microglia distinction; **hero-visual terminal frame** | ADOPT #1 |
| **FAERS** (openFDA) | Real-world pharmacovigilance | Coverage 9/27 (drug-like); method validated (haloperidol control ROR 39.6); **0/4 adversarials show any parkinsonism signal** | Independent human-outcome confirmation the decoys are correctly rejected | ADOPT #2 |
| **Human epidemiology** (published cohorts/meta-analyses) | Quantified PD/AD exposure risk | ~8/12 positives (paraquat ~2.5×, rotenone OR ~10); **literature-curation, not an API** | Orthogonal human-observational risk tier | ADOPT #3 (Claude Science curation task) |
| **BBB / brain-exposure** (EPA HTTK, structure BBB models, B3DB; NeuTox 2.0 noted) | Blood-brain-barrier permeability & brain exposure | Coverage 27/27 (structure-based); positives skew penetrant (6-OHDA correctly non-penetrant — sanity check) | Plausibility gate; explains **3/6 adversarial rejections** (non-penetrant / effluxed) — an orthogonal reason half the decoys can't be drivers | ADOPT (supporting gate) |

### Platform & positioning context

| Resource | What it is | Finding / role |
|---|---|---|
| **Claude Science** | AI research workbench (60+ DBs, auditable artifacts) | Requires Mac/Linux/WSL2; used as the evidence-assembly substrate — build *on* it | CORE platform |
| **Claude Code** | Agentic coding tool | Two concurrent streams (core ⟂ visualization) against a shared contract | CORE build method |
| **Prior-art landscape** (Miller/Barouki *Nat Neurosci*; ToxReason; ToxMCP; AOP-Smart; Co-Scientist/Robin; AlzPathway) | The published field | Established, not novel — used to position Aitiome honestly as the working prototype the field called for | Informs positioning |

---

## 5. The drift narrative (for the presentation)

If asked why the project differs from its original framing, the honest and compelling story is:

> "We started aiming to *discover* novel environmental drivers of neurodegeneration. Before building, we did the reconnaissance — and the data told us two things. First, that the field's leaders had already framed this exact goal in *Nature Neuroscience*, so novelty wasn't ours to claim. Second, and more importantly, we systematically tested seven ways to get an annotation-independent discovery signal for this chemical class, and every one failed — the environmental compounds aren't in the profiling databases, and bioactivity turns out not to be neurotoxicity. Rather than paper over that with a plausible-looking but unearned watchlist, we let the evidence redirect us. We built the thing the data *does* support: an engine that reconstructs endorsed mechanism, proves it recovers known neurotoxicants, and — the hard part — correctly refuses to be fooled by bioactive compounds that aren't neurotoxic, confirmed by three independent lines of evidence. And we turned the failure into a contribution: an honest map of exactly where AI-driven discovery is and isn't possible on this chemical class. What we're showing you is less flashy than the original pitch and far more trustworthy — which, for this problem, is the point."

Key points to hit: (1) the drift was **evidence-driven, not scope-creep**; (2) the **negative results are a genuine finding**, not a shortfall; (3) the final project is **more credible**, which is the right optimization for a mechanism-first scientific audience; (4) every design choice (curated recovery, DSSTox correctness, convergent evidence, never gating on bioactivity) traces to a specific thing we learned.
