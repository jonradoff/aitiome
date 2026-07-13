# Aitiome (AITIO) — Always-Loaded Constraint Memory

> Read `VIBECTL.md` for live project status. Read `docs/build-kickoff.md` (the MASTER BRIEF) before building.
> Read `learnings.md` for what we've learned building and red-teaming this (findings, gotchas, open critiques).
> This file is the non-negotiable constraint memory: every session inherits it. `docs/` holds the detail.
> The reconnaissance is **settled input**. Never silently contradict a recon finding — if you think one
> should be revisited, **stop and flag it to Jon**, don't work around it.

**Current state (2026-07-08):** engine + hero + panels + Claude evidence-reasoner shipped; deployed live
at https://aitiome.fly.dev (single Go binary serves web + `/api/*` + MCP sibling). Contract at **v1.2.0**.
A **falsification harness** (`make validate`, `/benchmark`) quantifies
the anti-diagnostic claim: bioactivity is at-or-below-chance vs the adversarial decoys while the curated
rule is perfect. Red-team findings and open critiques (esp. circularity) are logged in `learnings.md`.

**Repo + docs + site pages (2026-07-13):** repo is now **PUBLIC** (`github.com/jonradoff/aitiome`) —
`.env` is gitignored/never-committed; only `sk-ant-...` *placeholders* live in docs. MIT `LICENSE` (© 2026
Jon Radoff). Canonical MCP docs = **`mcp.md`** (repo root; grounded in `services/cmd/mcpd/main.go`, 13
read-only tools). README overhauled (hero screenshot `docs/assets/screenshot-hero.png`). The web app now uses
**react-router** with real routes: `/` (main), **`/rlm`** (RLM methods page, `web/src/pages/RlmPage.tsx`),
**`/mcp`** (`McpPage.tsx`); shared chrome in `web/src/site.tsx` (SiteHeader/SiteFooter + first-visit Welcome
modal + end-of-tour modal; global footer = "© 2026 Jon Radoff — MIT License | Built with Claude: Life
Sciences Hackathon" + nav links). **The deck PDF is served at `/presentation.pdf`**; `build-deck.mjs` writes it DIRECTLY to
`web/public/presentation.pdf` (the single tracked, served copy — Vite bundles `web/public/` into
`dist/`). No separate `docs/` copy anymore. **Identity gotcha (test-locked discipline):** rotenone =
`DTXSID6021248`, chlorpyrifos = `DTXSID4020458` — don't swap them (validation_set.csv is ground truth).

**Candidate pipeline shipped (2026-07-09, ADR-0006):** Aitiome is now a triage pipeline, not only a validator.
`/candidates?disease=` + MCP `list_candidates` return an **evidence-weighted-priority queue** of chemicals with
real-but-incomplete evidence (round-4: renamed from "VOI" — that term is formal/decision-theoretic, ours is a
transparent additive index; concede prior art ToxPi/IATA/ENRICH/PROTON; emerging classes PFAS/microplastics/PM2.5
held in a stated watch tier, glyphosate added to AD queue) (seeds: Paul & Ritz PD pesticides incl. gate-ready AOP-3 stressors
fenpyroximate/tebufenpyrad/pyrimidifen; PCE; AD metals/organochlorines from Bakulski/Yan/Jang). The **ranker is
transparent + additive** (published weights: AOP 5 · MECH 3 · IPSC 2 · EPI 2 · XDIS 2 · ZF 1 · INFERRED 0.5 ×
strength, +1/convergent-line), **NO learned weighting**. HARD invariants (test-locked in `candidates_test.go`):
entry needs ≥1 non-bioactivity strand; **only the curated gate promotes** (CTD DirectEvidence OR registered
in-scope AOP stressor); the **6 adversarial decoys are carried as a permanent control and MUST rank last**
(score 0); a **held-out backtest** recovers a known positive (TCE/DDE) from non-curated strands alone, above all
decoys — prioritization skill, NOT causal discovery. Data: `services/aitio/data/candidates_{pd,ad}.json` (evidence
JSON; scores DERIVED in Go). **PCE stays pending** (CTD batch+detail APIs ALTCHA-walled 2026-07 — the flagship
"stuck candidate"). Also folded in a friend's copy-precision edits to the About modal (Grandjean=developmental
caveat; softened Mack ~40%; validation mini-method w/ AUROC≈0.53; "OECD-endorsed where available, downgrade
registered-not-endorsed"; demo-loop sentence). Ceiling (do NOT cross): no from-structure prediction; time-dated
backtest + auto-ingestion are future phases.

**Round-3 scan + resolve typeahead (2026-07-09):** hyper-current pass (`docs/research/round3-literature-scan.md`)
re-tested the discovery limit — it **holds** (no neural-specific exposome-scale predictor on public data). The
resolve input got an intelligent typeahead over the curated benchmark (suggests only what resolves; free-text
out-of-set still hits the honest rejection). **Durable correction (do NOT reintroduce):** never claim the
exposome-wide approach "has never been pointed at PD/AD" — it's FALSE. Cite **Paul & Ritz, Nat Commun 2023**
(288-pesticide-wide PD screen → iPSC validation) and **Jang et al., Exposome 2025** (NHANES cognition ExWAS). The
defensible line: the *flagship multi-disease* exposome atlases (Patel & Manrai, Nat Med 2026) omit neuro, AND
population exposure→disease inference ≠ per-chemical neurotoxicity prediction (the recon-killed thing). **Open
candidate (pending gate):** perchloroethylene/PCE as a 14th PD positive — needs manual **CTD-PD DirectEvidence**
verification (CTD batch API now ALTCHA-walled); logged in `docs/excluded-sources.md`. Next up (planned, not built):
a **candidate-tracking pipeline** with evidence-weighted priority ranking to guide wet labs.

**Round-2 literature scan + TCE (2026-07-08):** a second deep-research pass (`docs/research/round2-literature-scan.md`)
added **trichloroethylene** as the **13th** curated PD positive (verified CTD-PD DirectEvidence; Camp Lejeune,
Goldman 2023) — PD is now **13/13** (28 compounds); the **Grandjean & Landrigan 2014** independent neurotoxicant
vote; **real AD epidemiology** (contested items flagged); and the **AD source-independence ablation** (honest:
AD leans ~11/12 on CTD, weaker circularity than PD). **Principled exclusions** (what we deliberately DON'T use +
why) are logged in `docs/excluded-sources.md` — a credibility asset for the report. Sharpening to remember:
pre-empt the "ML=90% AUROC" pushback via **Mack 2024** (ToxCast ~40% neural-relevant); don't claim first-mover on
AOP-network mapping (**Spinu NT-AOPn 2019**); neuroinflammation is *shared* PD/AD. Positioning: **PROTON** (Zitnik,
2025) is the discovery-predictor foil; **ToxReason/ES&T 2024** support the grounded approach. Resolved flag (2026-07-08):
the PD AOP-network 587/588/589/593 (EFSA-funded 2024 expansion of AOP-3) is recognized as **mechanistic
context + citation** (Sources page, deck compare matrix), tiered "under development" — the recovery
**predicate is unchanged** (paraquat was already positive and already reconstructs on AOP-593). It strengthens
the mechanistic/credibility story, not the numbers.

**Second disease axis — Alzheimer's (2026-07-08, live):** the engine is now **per-disease** (PD + AD;
`?disease=ad`, `/diseases`, MCP `disease` param). PD stays byte-identical; AD runs the *identical*
curated-diagnostic predicate (ADR-0005, "Option B": PD keeps the broad neuro-AOP leg, AD scopes the AOP
leg to AD AOPs {12,48,429,475}). AD basis = **real curated CTD-AD DirectEvidence** (MeSH D000544;
`scripts/pull-ctd-ad.sh`) + endorsed AOP-12/48 anchor; honesty is by **calibration, not less rigor**
(endorsement/tier surfaced; AD's weaker spots shown in the UI **compare matrix**). Plan `docs/ad-extension-plan.md`,
research `docs/research/ad-aop-literature-scan.md`, decision `docs/decisions/0005-ad-axis.md`. **Do NOT
re-anchor AD on PD AOPs or gate AD on assay** — same discipline as PD. Cross-disease: lead is positive for
both (PD broad leg / AD AOP-12). Open: AD quantified falsification (AUROC) is pending AD-assay data — not
fabricated; AD hero palette + convergent-evidence strands are follow-ups.

## Identity & the three win conditions

**Aitiome is an honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration.**
Given a chemical, it reconstructs the OECD-endorsed causal pathway (molecular initiating event → key
events → a neurodegeneration hallmark), grounds each edge in queryable evidence, and rates confidence.
It is **not** a system that claims to discover novel neurodegeneration-causing chemicals.

Design to all three co-equal win conditions:
1. **Validation that works** — visibly recover known neurotoxicants on the endorsed AOP scaffold, and
   correctly reject the adversarial decoys. The spine.
2. **A hero visual polished to extraordinary** — one signature visualization, mirror-finish. The renown lever
   and a **primary** win condition, not a finishing touch.
3. **Honest, calibrated framing** — calibrated language, confidence tiers, the negative-results discovery
   map surfaced as a feature. With mechanism-obsessed judges, this *is* the credibility.

## The recovery rule (HARD — see `docs/recovery-rule-spec.md`)

```
positive  ⟺  ( CTD curated Parkinson's DirectEvidence )  OR  ( registered neuro-AOP stressor )
```
tp=12, fp=0, fn=0 on the recon set. Curated signals are **diagnostic**. Assay/bioactivity activity is
**corroboration only and anti-diagnostic** — mito/general-bioactivity similarity scores *worse than chance*
against the decoys. **NEVER gate a positive call on assay/bioactivity activity.** Assay data illustrates
mechanism for known positives; it does not discriminate. NeurotoxKb = redundant confirming vote only.

## Hard data rules

- **Curated CTD `DirectEvidence` only.** Inferred CTD associations are noise (acetaminophen has 80 inferred
  PD links) and never touch a grade.
- **DSSTox/DTXSID-first identifier resolution with correct salt form.** Not PubChem-synonym guessing
  (the paraquat-dichloride trap). Wrong identity silently corrupts everything downstream.
- **Load `docs/recon/aop_scaffold.json` directly.** No in-window RDF/SPARQL parsing.

## Ground truth (`docs/recon/validation_set.csv` — surface `confidence_tier` on EVERY result)

- **12 positives.** `assay_mechanism_recovered` (6): rotenone, MPP+, paraquat, manganese chloride,
  methylmercury chloride, chlorpyrifos. `curated_anchored_only` (6): MPTP, maneb, lead acetate, deguelin,
  dieldrin, 6-hydroxydopamine.
- **15 negatives.** `adversarial_negative` (6, mito-active but non-neurotoxic — the decoys): troglitazone,
  prochloraz, propiconazole, simvastatin, fenofibrate, warfarin. Plus clean/weak negatives (acetaminophen,
  sulfamethoxazole, furosemide, fulvestrant, diethyl phthalate, ibuprofen, D-glucose, sucrose, sodium chloride).
- Every curated discriminator is 0/15 on negatives.

## AOP scaffold — MVP anchor = **AOP-3**

MIE **888** (binding of inhibitor, complex I) → KE **887** (complex-I inhibition) → KE **177** (mitochondrial
dysfunction) → KE **890** (nigrostriatal dopaminergic degeneration) → AO **896** (parkinsonian motor deficits),
with the **188 ↔ 890** neuroinflammation loop. 9 OECD-endorsed neuro AOPs total in the scaffold.

## Convergent evidence model (grounding/confidence strands — NOT new recovery gates)

The recovery *decision* stays on the curated diagnostic predicate. These strands ground the pathway, enrich
confidence, and harden the negatives — they never become recovery gates. Adopt in priority order (protect the
core first):
1. **Mechanistic + cell-type grounding** (`mitocarta_complexI.csv`, `brain_cell_genesets.csv`): MitoCarta3.0
   Complex-I Q-site subunits ground the MIE (gene-level); Kamath SOX6/AGTR1 vulnerable dopaminergic neurons
   ground the adverse outcome; also the **hero visual's terminal frame**. Keep this even under cuts.
2. **FAERS pharmacovigilance** (`faers_coverage.csv`): openFDA disproportionality; **0/4 assessable adversarial
   drugs show any parkinsonism signal across ~20M reports** (haloperidol control ROR 39.6).
3. **Human epidemiology** (`epidemiology_coverage.csv`): paraquat ~2.5×, rotenone OR ~2.5 (Tanner 2011 FAME) for ~8/12 positives.
   This is a **Claude Science literature-curation task, not an API pull**.
4. **BBB / brain-exposure** (`bbb_coverage.csv`): supporting plausibility gate, not a discriminator. 3/6
   adversarials are low-brain-exposure (warfarin protein-bound, fenofibrate BBB−, troglitazone non-penetrant,
   simvastatin P-gp-effluxed). 6-OHDA correctly non-penetrant = sanity check.

**The demo centerpiece:** the decoys are rejected by **three independent lines at once** — curated convergence
(no diagnostic signal) + BBB non-penetrance + zero FAERS parkinsonism signal. Skip PrimeKG/Hetionet (drug-keyed).

## Discovery = an honest map, NOT a predictor

Recon tested 7 discovery axes (L1000, HTTr, HTPP, structure/QSAR, full-ToxCast fingerprint, ComptoxAI/KG,
Boltz-2); **none is shippable** for this chemical class — each is coverage-killed (environmental compounds
aren't in the profiling DBs) or confounder-killed (general bioactivity ≠ neurotoxicity). **Ship the
negative-results map as a first-class feature.** Two honest, unproven leads remain: powering the neural-specific
axis (AUROC 0.72 but underpowered, perm-p 0.155) and the Boltz-2 Q-site benchmark (bounded, optional,
non-load-bearing — leads, not claims, always with explicit N).

## Architecture invariants

- **Transport-agnostic service layer** with **HTTP AND MCP adapters** as siblings — thin adapters over one
  service package. Design MCP tools as if an external agent will drive them. Dual human + agentic interface
  is a core pillar.
- **Core ⟂ visualization split** behind a **versioned `contract/`** (typed schema + fixtures): pathway graph
  nodes/edges, rankings, confidence tiers, validation results, animation/trace event stream, convergent-evidence
  strands, discovery-map data. Viz runs fully on contract fixtures; integration is a fixture→live flip.
- **Demo resilience:** every external source behind an interface with **fixtured responses** for showcase
  compounds.
- **Model configurable per role.** Default to the latest, most capable Claude models.
- **Stack:** Go backend (orchestration, recovery/ranking, validation harness, provenance, HTTP API);
  TypeScript + React frontend; Three.js for 3D/viz. Build **on Claude Science** (evidence assembly) and
  Claude Code. Evidence reasoning behind an `EvidenceReasoner` interface (reuse `centerstage-brain` /
  `wingman-cs-server` patterns — read the real code, don't invent a harness; keep a trivial direct impl for
  the cached/demo path).

## Visual/UI standard (PRIMARY win condition)

A beautiful, non-templated UI. Use the **Taste Skill** (`design-taste-frontend`) plus the local
`frontend-design` skill (Taste Skill leads on aesthetic direction). Register: **premium, calm, editorial
SCIENTIFIC INSTRUMENT** — restrained palette, strong typographic hierarchy, generous whitespace, purposeful
motion. Trustworthy, never flashy or "gamey" (the judges are scientists); drama comes from the data viz.
**Dark-mode by default, light-mode parity.** Three.js + GLSL shaders greenlit for the hero visualization
(mechanistic cascade, exposome/particle field, evidence-weighted glowing edges, terminal SOX6/AGTR1
dopaminergic-neuron frame). Motion serves comprehension; keep it performant and legible. **Molecular/atomistic
rendering is out of scope** (don't out-render Mol*/Drew Berry).

**Hero shot:** validation recovery + the three-line adversarial rejection as motion, resolving into the
vulnerable dopaminergic-neuron population. The single screenshot that travels — polish to a mirror finish.

## RLM-vs-RAG evidence harness (ADR-0007, `services/aitio/rlm/` — OFFLINE ONLY)

Offline experiment comparing four evidence-assembly systems (RAG, RAG+, RLM-1, RLM-ADV) on a shared
deterministic validator. **Never on the live request path; never touches the recovery gate.** Results +
method in `docs/research/rlm/` (`FINDINGS.md`, per-chemical JSON). Run via `scripts/rlm-eval-all.sh`
(resumable: `--resume` skips banked systems, `--systems` filters, incremental per-system persistence).
**Durable gotchas (violating these re-breaks fixed bugs):**
- **Hand-accumulate streamed responses** — anthropic-sdk-go v1.56.0 `Message.Accumulate` crashes
  re-marshaling empty `web_search_tool_result` blocks. We pull text/usage/stop-reason off the event stream.
- **Server-side `web_search` is org-rate-limited** — keep `leafConcurrency` low (2); 4 concurrent leaves
  starve each other (single-pass RAG succeeds while parallel leaves time out).
- **Planner/critic (`callJSON`) run thinking DISABLED** — else thinking tokens eat the JSON budget → empty plan.
- **Never pass `ANTHROPIC_API_KEY` with shell-escaped quotes** — `loadKey()` reads ambient env then `.env`; a
  garbage override = 401. Inherit the ambient env.
- **Deck PDF build needs the capture pipeline first** (`/tmp/deck-*.png`); `build-deck.mjs` alone fails at load.
- Live RLM (future) must be **BYOK + gated + rate-limited + fixtured** — casual app use must not spend our key.

## Working agreement (rule for the agent)

- When any design/implementation choice touches the above, **cite the relevant `docs/` file** in your reasoning.
- **Never silently contradict a recon finding.** Believe one should be revisited → stop and flag it to Jon.
- Log decisions as ADRs in `docs/decisions/`, each naming the recon finding it rests on.
- Interactive review gates: at each gate, stop, present decisions as a numbered list with recommendation +
  alternatives + tradeoffs, and wait for sign-off. Small commits; app runnable after each.
