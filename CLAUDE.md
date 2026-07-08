# Aitiome (AITIO) — Always-Loaded Constraint Memory

> Read `VIBECTL.md` for live project status. Read `docs/build-kickoff.md` (the MASTER BRIEF) before building.
> Read `learnings.md` for what we've learned building and red-teaming this (findings, gotchas, open critiques).
> This file is the non-negotiable constraint memory: every session inherits it. `docs/` holds the detail.
> The reconnaissance is **settled input**. Never silently contradict a recon finding — if you think one
> should be revisited, **stop and flag it to Jon**, don't work around it.

**Current state (2026-07-08):** engine + hero + panels + Claude evidence-reasoner shipped; deployed live
at https://aitiome.fly.dev (single Go binary serves web + `/api/*` + MCP sibling). Contract at **v1.2.0**.
Private repo `jonradoff/aitiome`. A **falsification harness** (`make validate`, `/benchmark`) quantifies
the anti-diagnostic claim: bioactivity is at-or-below-chance vs the adversarial decoys while the curated
rule is perfect. Red-team findings and open critiques (esp. circularity) are logged in `learnings.md`.

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
3. **Human epidemiology** (`epidemiology_coverage.csv`): paraquat ~2.5×, rotenone OR ~10 for ~8/12 positives.
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

## Working agreement (rule for the agent)

- When any design/implementation choice touches the above, **cite the relevant `docs/` file** in your reasoning.
- **Never silently contradict a recon finding.** Believe one should be revisited → stop and flag it to Jon.
- Log decisions as ADRs in `docs/decisions/`, each naming the recon finding it rests on.
- Interactive review gates: at each gate, stop, present decisions as a numbered list with recommendation +
  alternatives + tradeoffs, and wait for sign-off. Small commits; app runnable after each.
