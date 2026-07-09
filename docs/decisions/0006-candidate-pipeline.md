# ADR-0006 — The candidate pipeline (triage queue + value-of-information ranking)

**Status:** accepted (2026-07-09) · **Supersedes/extends:** the discovery-map framing (recon "discovery is a
map, not a predictor")

## Context

Recon killed the *predictor* form of discovery for this chemical class: predicting whether an **arbitrary**
chemical is a neurotoxicant from its **structure/bioactivity** is coverage-killed (environmental compounds absent
from profiling DBs) and confounder-killed (general bioactivity scores at/below chance vs the adversarial decoys —
anti-diagnostic). That finding is **settled input** and is not revisited here.

Round-3 (`docs/research/round3-literature-scan.md`) sharpened the picture: exposure-wide *epidemiology* of
neurodegeneration is real and valuable (Paul & Ritz, *Nat Commun* 2023 — a 288-pesticide-wide PD screen → iPSC
validation; Jang et al., *Exposome* 2025 — NHANES cognition ExWAS). Paul & Ritz in particular is a peer-reviewed
**screen → prioritize → wet-lab validate** loop. That is a *different problem* from the recon-killed predictor:
it ranks chemicals that already carry real human/mechanistic evidence, and routes the best to the bench.

## Decision

Add a **candidate pipeline**: a disease-scoped, ranked queue of chemicals that are NOT confirmed positives but
carry partial/pending evidence, with a transparent **value-of-information (VOI)** ranking that guides curation
and wet-lab effort. This is the honest, buildable form of the "untargeted-discovery half" — a triage layer, not
an oracle.

### Invariants (these are what keep it honest — do not weaken)
1. **Entry requires ≥1 real, non-bioactivity evidence strand** (epidemiology, mechanistic/complex-I/mito/amyloid,
   iPSC/zebrafish toxicity, registered AOP stressor, or cross-disease). **General bioactivity is barred** — it is
   the anti-diagnostic confound recon falsified.
2. **The ranker is transparent and additive**, weights published in the contract (`CandidateWeight`). **No learned
   / black-box weighting** — a learned ranker would reintroduce overfitting and circularity.
3. **Only the curated gate promotes.** A candidate becomes a positive ONLY on curated CTD DirectEvidence OR a
   registered in-scope AOP stressor. Epidemiology and CTD-*inferred* links justify *queue priority*, never a grade
   (the acetaminophen-80-inferred-links rule holds).
4. **The adversarial decoys are carried as a permanent negative control** and must rank last. If a decoy floats up,
   the ranker has relearned the confound and is wrong — this is live QA on the ranker itself.
5. **The held-out backtest proves prioritization skill, not causal discovery.** We withhold a known positive's
   curated evidence and show its convergent non-curated strands still outrank every decoy.

### The VOI ranker (v1, published weights)
Additive over non-bioactivity strands: `AOP 5 · MECH 3 · IPSC 2 · EPI 2 · XDIS 2 · ZF 1 · INFERRED 0.5`, each
scaled by strength (`strong 1.0 · moderate 0.6 · weak 0.3`), plus a convergence bonus (`+1` per independent line
beyond the first). Decoys carry no qualifying strand → score 0.

## Consequences

- Aitiome becomes a **pipeline** with states: `flagged → pending-evidence → (promotable) → positive`, or parked.
  **PCE is the first item in "pending_verification"** — the flagship stuck candidate (CTD batch API is ALTCHA-walled).
- Seeds (`services/aitio/data/candidates_{pd,ad}.json`) come from Paul & Ritz (PD pesticides, incl. gate-clearing
  AOP-3 stressors fenpyroximate/tebufenpyrad/pyrimidifen), Dorsey 2025 (PCE), Bakulski 2020 / Yan 2016 / Jang 2025
  (AD metals & organochlorines), each with provenance.
- **Ceiling (stated, not crossed):** no from-structure prediction; sparse-evidence chemicals are shown as
  unrankable rather than guessed; the backtest is prioritization skill, bounded.

## Phased path (each phase independently shippable and honest)
1. **Queue + VOI ranker + decoy control + held-out backtest** ← this ADR.
2. Recommended-experiment layer per candidate (VOI → the bench action). *(landed with phase 1)*
3. Time-dated backtest (rank on pre-dated evidence; show later-curated positives surface). *Future — needs
   per-strand evidence dating.*
4. Automated multi-source ingestion + agentic loop over MCP. *Future.*

## Recon findings this rests on
- "Discovery is a map, not a predictor" — general bioactivity anti-diagnostic (`docs/recon-learnings-summary.md`).
- Curated-diagnostic-only recovery rule (`docs/recovery-rule-spec.md`, `CLAUDE.md`).
- Round-3 scan: Paul & Ritz precedent + the exposure-inference vs per-chemical-prediction distinction.
