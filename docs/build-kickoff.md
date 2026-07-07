# Aitiome — Build-Week Claude Code Kickoff (definitive)

> Supersedes all prior drafts. This is the build kickoff for **Built with Claude: Life Sciences** (July 7–13, judged with the Gladstone Institutes). It incorporates a completed multi-round data reconnaissance (the `bio-recon` repo) — hand its findings and assets to this build. Copy everything below into Claude Code.

---

I'm building this over one week, full-time. Act as lead engineer: plan first, run the review gates, keep a runnable demo at every stage. The reconnaissance is done — its findings are settled and non-negotiable inputs here; don't relitigate them, build on them. The goal is to be judged credible by a mechanism-obsessed Gladstone scientist, which means a working, validated, visually extraordinary, and scrupulously honest demonstration — not a flashy overclaim.

## Mission & identity

**Aitiome is an honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration.** Given a chemical, it reconstructs the endorsed causal pathway from molecular initiating event → key events → a neurodegeneration hallmark, grounded edge-by-edge in queryable evidence and rated by confidence; it proves itself by recovering known neurotoxicants *and* by correctly refusing to flag bioactive compounds that aren't neurotoxic; and it is transparent about exactly where AI-driven discovery is and isn't possible on this chemical class.

What it is **not**: a system that claims to discover novel Alzheimer's-causing chemicals. Recon established there is no shippable unsupervised-discovery signal for this compound class on public data (see below). The honesty about that limit is a feature and a credibility asset, not a gap.

## The three win conditions (co-equal — design to all three)

1. **Validation that works** — visibly recover known neurotoxicants on the endorsed AOP scaffold, and correctly reject the adversarial decoys. The spine.
2. **A hero visual polished to extraordinary** — one signature visualization, mirror-finish. The renown lever.
3. **Honest, frontier-aware framing** — calibrated language, confidence tiers, and the negative-results map surfaced as a feature. With these judges, this *is* the credibility.

## What the recon settled (baked-in inputs — do not rediscover)

- **Recovery rule is curated, not assay-based.** The zero-error predicate on the validation set is `(CTD curated Parkinson's DirectEvidence) OR (registered neuro-AOP stressor)`. These curated signals are **diagnostic**. Assay/bioactivity activity is **confirmatory-only and anti-diagnostic** — mitochondrial and general-bioactivity similarity score *worse* than chance against the decoys. **Never gate a positive call on assay/bioactivity activity.** Assay data illustrates mechanism for known positives; it does not discriminate.
- **Validation set (ground truth):** 12 positives — 6 `assay_mechanism_recovered` (rotenone, paraquat, MPP+, methylmercury, chlorpyrifos, MnCl₂) + 6 `curated_anchored_only` (MPTP, maneb, dieldrin, lead, deguelin, 6-OHDA); 15 negatives — 6 clean (fulvestrant, acetaminophen, furosemide, sulfamethoxazole, diethyl phthalate, +1) + **6 adversarial** (troglitazone, prochloraz, propiconazole, simvastatin, fenofibrate, warfarin) that are bioactive/mito-active yet non-neurotoxic. Every curated discriminator is 0/15 on negatives.
- **AOP scaffold:** 9 OECD-endorsed neuro AOPs exported to `aop_scaffold.json` (nodes + KER edges + endorsement status). **MVP anchor = AOP 3:** MIE 888 → 887 complex-I inhibition → 177 mito dysfunction → 890 nigrostriatal dopaminergic degeneration → 896 parkinsonian deficits (with the 188↔890 neuroinflammation loop). Load it directly — no in-window RDF parsing.
- **The specificity result is the demo centerpiece.** The engine must correctly *reject* the 6 adversarial decoys (bioactive, even mito-active, but not neurotoxic) by requiring curated convergence — the thing every profiling/similarity axis failed to do. Showing that rejection preempts the #1 skeptic attack ("you're just detecting bioactivity").
- **The negative-results discovery map is a first-class deliverable.** Recon tested 7 discovery axes (L1000, HTTr, HTPP, structure/QSAR, full-ToxCast fingerprint, ComptoxAI/KG, Boltz-2). All are coverage-killed (environmental compounds aren't in the profiling databases) or confounder-killed (bioactivity ≠ neurotoxicity, and the confound is general bioactivity, not just cytotoxicity). Two honest, unproven leads remain: powering the neural-specific axis, and running the Boltz-2 Q-site benchmark. This map — *why unsupervised discovery doesn't drop in for free on this class* — is a genuine contribution; feature it.
- **Hard data rules:** curated `DirectEvidence` only (inferred CTD associations never touch a grade); never gate on mito/bioactivity activity; **DSSTox/DTXSID-first identifier resolution with correct salt form** (not PubChem-synonym guessing — the paraquat-dichloride trap). These are day-one, first-class, tested components.
- **Recon assets to load from `bio-recon`:** `validation_set.csv` (with `confidence_tier`), `aop_scaffold.json`, `coverage_matrix.csv`, the discovery scorecard, `data-source-map.md` (access routes: ICE is key-free; working host is `comptox.epa.gov/ctx-api`; CCTE key pending for raw AC50s); enrichment assets `mitocarta_complexI.csv`, `brain_cell_genesets.csv`, `faers_coverage.csv`, `epidemiology_coverage.csv`, `bbb_coverage.csv`; and — if we attempt the physics lead — `boltz2_input_template.yaml` + `boltz2_ligands.csv`.

## Convergent evidence model (enrichment recon — adopt in priority order)

The engine's evidence layer is **multi-strand and convergent**: beyond the curated recovery decision, each compound's pathway is grounded, and its confidence enriched, by independent evidence tiers. **Discipline: the recovery *decision* stays on the curated diagnostic predicate — these strands are grounding, confidence, and plausibility, never new recovery gates.** They sharply deepen credibility (especially on the negatives) and the visual, at low effort. Fold in this order; protect the core first.

- **Mechanistic + cell-type grounding (ADOPT #1, low effort).** Ground AOP-3's endpoints in real data: MitoCarta3.0 gives all six Complex-I Q-site subunits for the MIE (gene-level); Kamath's SOX6/AGTR1 vulnerable dopaminergic neurons ground the adverse outcome; Bryois grounds the PD→DA-neuron-mitochondrial vs. AD→microglia distinction. Both mechanism depth *and* the hero visual's terminal frame (the cascade resolving into the actual vulnerable neuron population). Assets: `mitocarta_complexI.csv`, `brain_cell_genesets.csv`.
- **Real-world pharmacovigilance — FAERS (ADOPT #2, low effort).** Human-outcome strand via openFDA disproportionality (ROR/PRR) for parkinsonism; coverage 9/27 (drug-like only). The sharp result: **0/4 assessable adversarial drugs show any parkinsonism signal across ~20M reports** (method validated, haloperidol control ROR 39.6) — independent real-world confirmation the decoys are correctly rejected. Asset: `faers_coverage.csv`.
- **Human epidemiology (ADOPT #3, low–med).** Quantified PD/AD risk (paraquat ~2.5×, rotenone OR ~10) for ~8/12 positives — a human-observational tier. **This is an in-window Claude Science literature-curation task, not an API pull.** Asset: `epidemiology_coverage.csv` (the curated seed to extend).
- **BBB / brain-exposure (SUPPORTING GATE, low effort).** Plausibility layer, not a discriminator: positives skew penetrant (6-OHDA correctly non-penetrant — a clean sanity check; metals enter via transporters), and **3/6 adversarials are low-brain-exposure** (warfarin protein-bound, fenofibrate BBB−, troglitazone non-penetrant, simvastatin P-gp-effluxed) — an orthogonal pharmacokinetic reason for half the adversarial rejections. Coverage 27/27 (structure-based). Asset: `bbb_coverage.csv`.
- **SKIP: PrimeKG/Hetionet** — DrugBank-keyed, only ~1/12 environmental positives are nodes; CTD + AOP-Wiki already ground all 12 better. At most a downstream gene/pathway scaffold reached via CTD.

**The payoff — a convergent-evidence display:** each compound scored across curated mechanism, assay corroboration, mechanistic/cell-type grounding, pharmacovigilance, epidemiology, and brain-exposure plausibility, with every strand's confidence shown and convergence/divergence visible. This *is* the calibrated-honesty identity, deepened — and it independently hardens the negatives story: the decoys are rejected by curated convergence **and** BBB non-penetrance **and** FAERS, three independent lines at once.

## How we'll work — interactive review gates

At each gate: **stop, present decisions as a numbered list with your recommendation, alternatives, and tradeoffs, and wait for my sign-off.** Surface guesses rather than deciding silently.

- **Gate 0 — Plan.** Repo structure (two parallel streams), a v1 draft of the core⟂viz data contract, Phase 1 task list, Claude Science integration plan verified against current docs, and clarifying questions.
- **Gate 1 — Fresh prior-art scan.** Independently confirm the current landscape and propose the honest positioning ("the validated, calibrated engine + discovery map the field's roadmap called for," citing Miller/Barouki et al.). No building on a false premise.
- **Gate 1.5 — Weaknesses & Assumptions.** Surface load-bearing risks + mitigations, especially validation-set integrity, the Claude Science integration, and the DSSTox resolution correctness.
- **Gate 2 — Spine & validation review.** Once the spine runs, walk me through what it does and how cleanly it recovers the knowns and rejects the adversarials.
- **Gate 3 — Hero visual + scope call.** Review the signature visualization and confirm final-days scope.

## Gladstone + hackathon success criteria (condensed)

- Neuroscience is load-bearing: pathways terminate in *their* hallmarks (mitochondrial/ROS, tau/amyloid/APOE4, glial neuroinflammation, BBB) and speak to their open question (non-genetic drivers of sporadic disease). Output = testable, prioritized, honestly-hedged hypotheses a lab could act on.
- Never overclaim causation — evidence-ranked hypotheses, explicit uncertainty.
- Build *on* Claude Science (research/evidence assembly) + Claude Code (the app); Claude is core. A working validated result beats a slick non-functional demo. Vivid shareable artifact. Honest positioning.

## The engine

**Validation mode (the working core).** Given a chemical: resolve identity (DSSTox-first) → assemble evidence via Claude Science → apply the curated recovery predicate → reconstruct the endorsed AOP pathway with per-edge grounding, mechanistic/cell-type anchoring, and a **convergent multi-strand confidence display** (see convergent evidence model) → and, for decoys, demonstrate correct rejection across independent strands. Recovery tiers surfaced on every result (`assay_mechanism_recovered` / `curated_anchored_only`), enriched by the orthogonal evidence strands — but the recovery decision itself never gates on them.

**Discovery represented honestly (not a working predictor).** Ship the **discovery map** as a first-class view: the axis scorecard, why each fails, and the two live leads — an AI tool transparent about its own epistemic limits. Optionally attempt the bounded experiments below, framed as *leads, not claims*.

## Stack

- **Backend:** Go — orchestration, recovery/ranking logic, validation harness, provenance, HTTP API.
- **Frontend:** TypeScript + React. **3D/viz:** Three.js.
- **Interfaces (first-class, both):** human web UI **and** MCP server over a shared transport-agnostic service layer (thin adapters). The dual human + agentic-interface pattern is a core pillar — depth and network effects; design the MCP tools as if an external agent will drive them. (Visual-layer time is protected by the parallel-workstream split, so MCP doesn't compete with the hero visual.)
- **Claude Science:** evidence-assembly substrate; integrate per current docs (verify at Gate 0).
- **Evidence reasoning (subordinate):** where deep single-compound evidence navigation helps, use an RLM strategy behind an `EvidenceReasoner` interface, reusing my `centerstage-brain` / `wingman-cs-server` patterns (read the real code; don't invent a harness). Keep a trivial direct implementation for the cached/demo path.
- **Demo resilience:** every external source behind an interface with fixtured responses for the showcase compounds.

## Parallel workstreams (core ⟂ visualization)

I run **two concurrent Claude Code sessions**: core intelligence/platform, and visualization. The **only coupling is a stable, versioned data contract** (`contract/`: typed schema + fixtures) — pathway graph, rankings, confidence tiers, validation results, the animation event stream, and the discovery-map data. The viz module is semi-independent (own dev server) and runs fully on contract-shaped fixtures, so it reaches polish without the core being live; integration is a fixture→live flip. Separate git worktrees/branches; the contract changes are announced as version bumps. Lock contract v1 early (Gate 0 draft, ratified Gate 2).

## Visual North Star

Live, data-driven, interactive, aesthetically ambitious — the gap between the **accurate-but-ugly** AOP tools (Cytoscape graphs) and the **beautiful-but-static** molecular films (Drew Berry / Goodsell).

- **Hero shot:** the validation-and-specificity reveal as motion — known neurotoxicants reconstructing their AOP-3 cascade and resolving into the actual vulnerable dopaminergic-neuron population (SOX6/AGTR1) as the terminal frame, while the bioactive decoys are visibly *withheld* and shown rejected on three converging strands (no curated signal, non-penetrant, no FAERS signal). "It recovers the real ones, resolves to the real neurons, and isn't fooled by the imposters," in one arc.
- **Canvas:** network / cascade / evidence-weighted-edge / particle level (Three.js strength). Uncertain edges and confidence tiers visibly encoded — honesty as a visual feature. Include the discovery-map view.
- **Out of scope:** atomistic molecular rendering (don't out-render Mol*/Drew Berry — a time rabbit hole). Beauty is at the systems level.

## Demo shape (5 beats)

1. Rotenone → correct AOP-3 pathway reconstructed, grounded, confidence-tiered.
2. Full known panel → clean recovery, tiers visible (the trust proof).
3. **The centerpiece:** simvastatin/troglitazone (bioactive, mito-active) → correctly *not* flagged, and shown rejected by **three independent lines at once** — curated convergence (no diagnostic signal), brain-exposure (non-penetrant / P-gp-effluxed), and real-world pharmacovigilance (0/4 parkinsonism signal across ~20M FAERS reports). The most credible specificity moment in the demo.
4. The honest discovery map → "here's where unsupervised discovery works and doesn't on this class, and the two leads worth pursuing."
5. All in the live visualization + a live MCP call showing an external agent querying the same engine.

## Honest-framing guardrails (UI copy + pitch)

- "Evidence-ranked mechanistic hypothesis," never "causes." Confidence + evidence shown on every result; thin evidence flagged. Cite the literature the positioning rests on. The discovery map's honesty is surfaced, not hidden.

## Optional discovery experiments (bounded, NON-load-bearing)

Only if the core is ahead and time allows; framed as leads, not claims; never block the spine or hero visual.
- **Boltz-2 Q-site benchmark** — recon prepped it to one step (`boltz2_input_template.yaml`, `boltz2_ligands.csv`, target PDB 5XTD subunits ND1/NDUFS2/NDUFS7). Needs a ~48 GB GPU (Rowan/Boltz API). The gate: does predicted engagement separate the 12 positives from the 6 adversarial decoys? Even small-N, report with explicit N and confidence.
- **Power the neural-specific axis** — the recon's best point estimate (AUROC 0.72 with viability endpoints excluded) but underpowered (perm-p 0.155). Only worth it with a materially larger reference set; otherwise leave as documented lead.

## Build order & cut line

Principle: real, validated data spine before visual polish; but the hero visual runs in parallel on contract fixtures, so it never waits on the core.

**Core stream:**
- **Phase 1 (~Wed):** service layer + HTTP + MCP; Claude Science integration; DSSTox-first resolver; load `aop_scaffold.json` + `validation_set.csv`; the **validation harness** (recovers knowns, rejects adversarials); emit the trace-event stream + v1 contract. (Gate 2.)
- **Phase 2 (~Fri):** the convergent-evidence display (mechanistic/cell-type grounding first, then FAERS, epidemiology, BBB — in priority order), provenance drawer, the discovery-map view, interactive exploration on live data. Epidemiology is a Claude Science curation task, not an API pull.

**Visualization stream (parallel from Day 1, on fixtures):** build + polish the hero reveal (recovery + adversarial rejection as motion) and the discovery-map visual.

**Integration:** flip fixtures → live once Phase 1 emits real results.

Under time pressure, protect (1) the working validation-and-specificity and (2) the hero visual. Cuttable in reverse priority: the optional discovery experiments first; then enrichment strands (epidemiology → FAERS → BBB) — but **keep the mechanistic/cell-type grounding**, since it doubles as the hero visual's terminal frame; then MCP *breadth* (keep the pattern); then secondary views.

## First response (Gate 0)

1. Monorepo structure for two parallel streams — shared `contract/` seam; service layer with HTTP + MCP adapters; connector interfaces + fixtures; DSSTox resolver; validation harness; provenance; semi-independent visualization module with its own dev server. Include git-worktree split and a **v1 contract draft**.
2. Phase 1 task list, first 3–4 commits — first commit stands up the service layer with one trivial operation over both HTTP and MCP.
3. Claude Science integration plan, verified against current docs (flag anything unconfirmed).
4. Clarifying questions — API keys to provision, library choices. Assume I'll hand you the `bio-recon` assets and the `centerstage-brain` / `wingman-cs-server` RLM patterns; tell me how you want them.

Then stop and wait for approval. After Gate 0, next is Gate 1 (prior-art scan) and Gate 1.5 (W&A) before feature code. Small commits; app runnable after each.
